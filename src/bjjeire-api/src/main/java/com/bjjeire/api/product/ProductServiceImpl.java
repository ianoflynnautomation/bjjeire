package com.bjjeire.api.product;

import com.bjjeire.api.audit.AuditAction;
import com.bjjeire.api.audit.AuditInfoProvider;
import com.bjjeire.api.audit.AuditRecorder;
import com.bjjeire.api.common.ApiCache;
import com.bjjeire.api.common.PagedResponse;
import com.bjjeire.api.common.PagedResponses;
import com.bjjeire.api.common.PaginationRequest;
import com.bjjeire.api.common.UriService;
import com.bjjeire.api.web.ApiProblems;
import com.bjjeire.api.web.ProblemTypes;
import java.util.ArrayList;
import java.util.Collection;
import java.util.EnumMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

/**
 * Mongo implementation of {@link ProductService}.
 *
 * <p>Every organiser write is a guarded {@code findAndModify}: it applies only to the version it was made from, and
 * only while each size still holds what it held when the write was worked out. Checkouts change {@code held} without
 * touching {@code version} (slice 3), so the second guard stops an edit from overwriting a hold taken meanwhile.
 */
@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {
    private static final Sort PUBLIC_ORDER = Sort.by(Sort.Order.asc("kind"), Sort.Order.asc("name"));

    private final MongoTemplate mongoTemplate;
    private final AuditInfoProvider auditInfoProvider;
    private final AuditRecorder auditRecorder;
    private final ApiCache cache;
    private final UriService uriService;
    private final ProductPhotoStore photoStore;

    @Override
    public PagedResponse<ProductSummaryDto> getPublished(PaginationRequest paginationRequest, String basePath) {
        String key = "Products_Page%d_PageSize%d".formatted(paginationRequest.page(), paginationRequest.pageSize());
        PagedResponse<ProductSummaryDto> page = cache.getOrCreate(
                ApiCache.MERCH_TAG,
                key,
                () -> loadPage(
                        paginationRequest,
                        Criteria.where("status").is(ProductStatus.PUBLISHED),
                        ProductMapper::toSummary));
        return PagedResponses.withNavigationLinks(page, uriService, basePath);
    }

    @Override
    public Optional<ProductDto> getPublishedBySlug(String slug) {
        return Optional.ofNullable(cache.getOrCreate(ApiCache.MERCH_TAG, "Product_Slug" + slug, () -> {
            Product product = mongoTemplate.findOne(
                    Query.query(Criteria.where("slug").is(slug).and("status").is(ProductStatus.PUBLISHED)),
                    Product.class);
            return product == null ? null : ProductMapper.toDto(product);
        }));
    }

    @Override
    public List<ProductOffer> getOffers(Collection<String> ids) {
        return mongoTemplate.find(Query.query(Criteria.where("_id").in(ids)), Product.class).stream()
                .map(ProductServiceImpl::toOffer)
                .toList();
    }

    private static ProductOffer toOffer(Product product) {
        Map<SizeId, Integer> available = new EnumMap<>(SizeId.class);
        sizesOf(product).forEach(size -> available.put(size.getId(), ProductRules.available(size)));
        List<String> photos = product.getPhotos() == null ? List.of() : product.getPhotos();
        return new ProductOffer(
                product.getId(),
                product.getName(),
                product.getKind(),
                product.getPriceCents(),
                product.getStatus() == ProductStatus.PUBLISHED,
                photos.isEmpty() ? null : photos.getFirst(),
                available);
    }

    @Override
    public Optional<ProductPhoto> getPhoto(String sha256) {
        return photoStore.load(sha256);
    }

    @Override
    public PagedResponse<AdminProductDto> getAllForAdmin(PaginationRequest paginationRequest, String basePath) {
        PagedResponse<AdminProductDto> page = loadPage(paginationRequest, new Criteria(), ProductMapper::toAdminDto);
        return PagedResponses.withNavigationLinks(page, uriService, basePath);
    }

    @Override
    public Optional<AdminProductDto> getForAdmin(String id) {
        return Optional.ofNullable(mongoTemplate.findById(id, Product.class)).map(ProductMapper::toAdminDto);
    }

    @Override
    public AdminProductDto create(CreateProductCommand command) {
        ProductRules.requireUniqueSizes(
                command.sizes().stream().map(SizeStockDto::id).toList());
        List<ProductSize> sizes = ProductRules.ordered(command.sizes().stream()
                .map(size -> ProductSize.builder()
                        .id(size.id())
                        .stock(size.stock())
                        .held(0)
                        .build())
                .toList());
        Product product = Product.builder()
                .slug(command.slug())
                .name(command.name().trim())
                .kind(command.kind())
                .description(command.description().trim())
                .priceCents(command.priceCents())
                .sizes(new ArrayList<>(sizes))
                .status(ProductStatus.DRAFT)
                .version(0L)
                .createdOnUtc(auditInfoProvider.currentInstant())
                .createdBy(auditInfoProvider.currentUser())
                .build();
        Product saved;
        try {
            saved = mongoTemplate.insert(product);
        } catch (DuplicateKeyException duplicate) {
            throw slugTaken(duplicate);
        }
        afterWrite(AuditAction.Create, saved.getId());
        return ProductMapper.toAdminDto(saved);
    }

    @Override
    public Optional<AdminProductDto> update(String id, UpdateProductCommand command) {
        Product existing = mongoTemplate.findById(id, Product.class);
        if (existing == null) {
            return Optional.empty();
        }
        List<String> photos = keptPhotos(existing, command.photos());
        List<ProductSize> sizes = mergeSizes(existing, command.sizes(), true);
        if (existing.getStatus() == ProductStatus.PUBLISHED) {
            // What visitors already see must stay publishable.
            ProductRules.requirePublishable(photos, sizes);
        }

        Update update = new Update()
                .set("slug", command.slug())
                .set("name", command.name().trim())
                .set("kind", command.kind())
                .set("description", command.description().trim())
                .set("priceCents", command.priceCents())
                .set("photos", photos)
                .set("sizes", sizes);
        Product saved;
        try {
            saved = modify(existing, command.version(), Set.of(existing.getStatus()), false, update);
        } catch (DuplicateKeyException duplicate) {
            throw slugTaken(duplicate);
        }
        if (saved == null) {
            throw changedMeanwhile();
        }
        deleteUnusedPhotos(removed(existing.getPhotos(), photos));
        afterWrite(AuditAction.Update, id);
        return Optional.of(ProductMapper.toAdminDto(saved));
    }

    @Override
    public Optional<AdminProductDto> publish(String id) {
        Product existing = mongoTemplate.findById(id, Product.class);
        if (existing == null) {
            return Optional.empty();
        }
        if (existing.getStatus() == ProductStatus.PUBLISHED) {
            return Optional.of(ProductMapper.toAdminDto(existing));
        }
        ProductRules.requirePublishable(existing.getPhotos(), existing.getSizes());
        // The check ran on a copy; the write requires a photo and a size too.
        Product saved = modify(
                existing,
                existing.getVersion(),
                Set.of(ProductStatus.DRAFT, ProductStatus.HIDDEN),
                true,
                new Update().set("status", ProductStatus.PUBLISHED));
        if (saved == null) {
            throw changedMeanwhile();
        }
        afterWrite(AuditAction.Publish, id);
        return Optional.of(ProductMapper.toAdminDto(saved));
    }

    @Override
    public Optional<AdminProductDto> hide(String id) {
        Product existing = mongoTemplate.findById(id, Product.class);
        if (existing == null) {
            return Optional.empty();
        }
        if (existing.getStatus() == ProductStatus.HIDDEN) {
            return Optional.of(ProductMapper.toAdminDto(existing));
        }
        if (!existing.getStatus().canBecome(ProductStatus.HIDDEN)) {
            throw ApiProblems.conflict(
                    ProblemTypes.CONFLICT, "Only a published product can be hidden. A draft is not on sale yet.");
        }
        Product saved = modify(
                existing,
                existing.getVersion(),
                Set.of(ProductStatus.PUBLISHED),
                false,
                new Update().set("status", ProductStatus.HIDDEN));
        if (saved == null) {
            throw changedMeanwhile();
        }
        afterWrite(AuditAction.Update, id);
        return Optional.of(ProductMapper.toAdminDto(saved));
    }

    @Override
    public Optional<AdminProductDto> setStock(String id, StockCommand command) {
        Product existing = mongoTemplate.findById(id, Product.class);
        if (existing == null) {
            return Optional.empty();
        }
        List<ProductSize> sizes = mergeSizes(existing, command.sizes(), false);
        Product saved = modify(
                existing, command.version(), Set.of(existing.getStatus()), false, new Update().set("sizes", sizes));
        if (saved == null) {
            throw changedMeanwhile();
        }
        afterWrite(AuditAction.Update, id);
        return Optional.of(ProductMapper.toAdminDto(saved));
    }

    @Override
    public Optional<String> addPhoto(String id, byte[] content) {
        if (!mongoTemplate.exists(Query.query(Criteria.where("_id").is(id)), Product.class)) {
            return Optional.empty();
        }
        if (content.length > ProductRules.MAX_PHOTO_BYTES) {
            throw ApiProblems.payloadTooLarge("A photo can be at most 5 MB. Send a smaller one.");
        }
        String contentType = ProductPhotoStore.detectType(content)
                .orElseThrow(() -> ApiProblems.unsupportedMediaType(
                        ProblemTypes.UNSUPPORTED_IMAGE, "A photo must be a JPEG, PNG or WebP image."));
        String sha256 = ProductPhotoStore.sha256(content);
        boolean storedNow = photoStore.store(sha256, content, contentType, auditInfoProvider.currentUser());

        // Room for one more, or the photo is on the product already: then adding it again changes nothing.
        Query query = Query.query(Criteria.where("_id")
                .is(id)
                .orOperator(
                        Criteria.where("photos").is(sha256),
                        Criteria.where("photos." + (ProductRules.MAX_PHOTOS - 1))
                                .exists(false)));
        Product saved = mongoTemplate.findAndModify(
                query,
                stamped(new Update().addToSet("photos", sha256)),
                FindAndModifyOptions.options().returnNew(true),
                Product.class);
        if (saved == null) {
            if (storedNow) {
                deleteUnusedPhotos(List.of(sha256));
            }
            if (!mongoTemplate.exists(Query.query(Criteria.where("_id").is(id)), Product.class)) {
                return Optional.empty();
            }
            throw ApiProblems.conflict(
                    ProblemTypes.TOO_MANY_PHOTOS,
                    "A product can show at most " + ProductRules.MAX_PHOTOS + " photos. Remove one first.");
        }
        afterWrite(AuditAction.Update, id);
        return Optional.of(sha256);
    }

    @Override
    public boolean delete(String id) {
        Product existing = mongoTemplate.findById(id, Product.class);
        if (existing == null) {
            return false;
        }
        if (existing.getStatus() != ProductStatus.DRAFT) {
            // Only a draft can be deleted, and a draft was never on sale, so no order names it.
            throw ApiProblems.conflict(
                    ProblemTypes.PRODUCT_NOT_DRAFT,
                    "Only a draft can be deleted. Hide this product to take it off sale.");
        }
        long removed = mongoTemplate
                .remove(
                        Query.query(Criteria.where("_id")
                                .is(id)
                                .and("status")
                                .is(ProductStatus.DRAFT)
                                .and("version")
                                .is(existing.getVersion())),
                        Product.class)
                .getDeletedCount();
        if (removed == 0) {
            throw changedMeanwhile();
        }
        deleteUnusedPhotos(existing.getPhotos() == null ? List.of() : existing.getPhotos());
        afterWrite(AuditAction.Delete, id);
        return true;
    }

    /**
     * Applies an organiser write only to the copy it was made from: the same version, an expected status, each size
     * still holding what it held, and with {@code requirePublishable} at least one photo and one size.
     *
     * @return the updated product, or null when the stored one no longer matches
     */
    private Product modify(
            Product read, Long version, Set<ProductStatus> expected, boolean requirePublishable, Update update) {
        List<Criteria> guards = new ArrayList<>();
        guards.add(Criteria.where("_id").is(read.getId()));
        guards.add(Criteria.where("version").is(version));
        guards.add(Criteria.where("status").in(expected));
        for (ProductSize size : sizesOf(read)) {
            guards.add(Criteria.where("sizes")
                    .elemMatch(Criteria.where("id").is(size.getId()).and("held").is(size.getHeld())));
        }
        if (requirePublishable) {
            guards.add(Criteria.where("photos.0").exists(true));
            guards.add(Criteria.where("sizes.0").exists(true));
        }
        return mongoTemplate.findAndModify(
                Query.query(new Criteria().andOperator(guards)),
                stamped(update),
                FindAndModifyOptions.options().returnNew(true),
                Product.class);
    }

    private Update stamped(Update update) {
        return update.set("updatedAt", auditInfoProvider.currentInstant())
                .set("updatedBy", auditInfoProvider.currentUser())
                .inc("version", 1);
    }

    /**
     * Applies stock counts to the stored sizes, keeping what each size holds.
     *
     * @param replace true when the list is every size the product keeps (an update): a size left out is removed, and a
     *     new size is added. False when it names only the sizes whose stock changes (a stock edit)
     */
    private static List<ProductSize> mergeSizes(Product existing, List<SizeStockDto> incoming, boolean replace) {
        ProductRules.requireUniqueSizes(incoming.stream().map(SizeStockDto::id).toList());
        Map<SizeId, ProductSize> current = new EnumMap<>(SizeId.class);
        sizesOf(existing).forEach(size -> current.put(size.getId(), size));
        Map<SizeId, Integer> stock = new EnumMap<>(SizeId.class);
        incoming.forEach(size -> stock.put(size.id(), size.stock()));

        if (!replace) {
            for (SizeId size : stock.keySet()) {
                if (!current.containsKey(size)) {
                    throw ApiProblems.validation(
                            "Sizes", "This product does not come in size " + size + ".", "UNKNOWN_SIZE");
                }
            }
        }
        if (replace) {
            for (ProductSize size : current.values()) {
                if (!stock.containsKey(size.getId()) && size.getHeld() > 0) {
                    throw ApiProblems.conflict(
                            ProblemTypes.SIZE_HAS_HOLDS,
                            "Size " + size.getId() + " has " + size.getHeld()
                                    + " held in unpaid checkouts, so it cannot be removed yet. Set its stock to "
                                    + size.getHeld() + " to stop new sales instead.");
                }
            }
        }

        Set<SizeId> kept = replace ? stock.keySet() : current.keySet();
        List<ProductSize> merged = new ArrayList<>();
        for (SizeId id : kept) {
            int held = current.containsKey(id) ? current.get(id).getHeld() : 0;
            int newStock =
                    stock.containsKey(id) ? stock.get(id) : current.get(id).getStock();
            ProductRules.requireStockCoversHeld(id, newStock, held);
            merged.add(ProductSize.builder().id(id).stock(newStock).held(held).build());
        }
        return new ArrayList<>(ProductRules.ordered(merged));
    }

    /** The photos an update keeps, in its order. Each must already be on the product: uploads add photos. */
    private static List<String> keptPhotos(Product existing, List<String> requested) {
        Set<String> current = new HashSet<>(existing.getPhotos() == null ? List.of() : existing.getPhotos());
        Set<String> kept = new LinkedHashSet<>();
        for (String photo : requested) {
            if (!current.contains(photo)) {
                throw ApiProblems.validation(
                        "Photos", "Photo " + photo + " is not one of this product's photos.", "UNKNOWN_PHOTO");
            }
            if (!kept.add(photo)) {
                throw ApiProblems.validation("Photos", "Photo " + photo + " is listed twice.", "DUPLICATE_PHOTO");
            }
        }
        return new ArrayList<>(kept);
    }

    private static List<String> removed(List<String> before, List<String> after) {
        if (before == null) {
            return List.of();
        }
        return before.stream().filter(photo -> !after.contains(photo)).toList();
    }

    /** Deletes each photo file that no product names any more. */
    private void deleteUnusedPhotos(List<String> photos) {
        for (String photo : photos) {
            if (!mongoTemplate.exists(Query.query(Criteria.where("photos").is(photo)), Product.class)) {
                photoStore.delete(photo);
            }
        }
    }

    private <T> PagedResponse<T> loadPage(
            PaginationRequest paginationRequest, Criteria criteria, Function<Product, T> mapper) {
        Query query = Query.query(criteria);
        long totalItems = mongoTemplate.count(query, Product.class);
        query.with(PageRequest.of(paginationRequest.page() - 1, paginationRequest.pageSize(), PUBLIC_ORDER));
        List<T> items =
                mongoTemplate.find(query, Product.class).stream().map(mapper).toList();
        return PagedResponses.of(items, paginationRequest, totalItems);
    }

    private static List<ProductSize> sizesOf(Product product) {
        return product.getSizes() == null ? List.of() : product.getSizes();
    }

    private void afterWrite(AuditAction action, String id) {
        auditRecorder.record(action, Product.ENTITY_NAME, id, 1);
        cache.removeByTag(ApiCache.MERCH_TAG);
    }

    private static OptimisticLockingFailureException changedMeanwhile() {
        // ApiExceptionHandler answers 409 urn:bjjeire:conflict, telling the caller to reload and retry.
        return new OptimisticLockingFailureException(
                "The product was changed by another save or a checkout. Reload it and retry.");
    }

    private static RuntimeException slugTaken(DuplicateKeyException duplicate) {
        RuntimeException conflict =
                ApiProblems.conflict(ProblemTypes.CONFLICT, "Another product already uses this slug.");
        conflict.addSuppressed(duplicate);
        return conflict;
    }
}
