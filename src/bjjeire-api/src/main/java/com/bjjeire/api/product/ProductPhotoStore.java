package com.bjjeire.api.product;

import com.mongodb.client.gridfs.GridFSBucket;
import com.mongodb.client.gridfs.GridFSBuckets;
import com.mongodb.client.gridfs.model.GridFSFile;
import com.mongodb.client.gridfs.model.GridFSUploadOptions;
import com.mongodb.client.model.Filters;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Optional;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

/**
 * Product photos in the GridFS bucket {@code productPhotos} (research R4). A file's name is the SHA-256 hex of its
 * bytes, so the same photo is stored once and its address never changes.
 */
@Component
public class ProductPhotoStore {
    public static final String BUCKET = "productPhotos";

    private static final String CONTENT_TYPE = "contentType";
    private static final String UPLOADED_BY = "uploadedBy";

    private final GridFSBucket bucket;

    public ProductPhotoStore(MongoTemplate mongoTemplate) {
        this.bucket = GridFSBuckets.create(mongoTemplate.getDb(), BUCKET);
    }

    /**
     * Tells which image type the first bytes show.
     *
     * @return {@code image/jpeg}, {@code image/png} or {@code image/webp}, or empty for anything else
     */
    public static Optional<String> detectType(byte[] content) {
        if (startsWith(content, 0, new int[] {0xFF, 0xD8, 0xFF})) {
            return Optional.of("image/jpeg");
        }
        if (startsWith(content, 0, new int[] {0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A})) {
            return Optional.of("image/png");
        }
        if (startsWith(content, 0, ascii("RIFF")) && startsWith(content, 8, ascii("WEBP"))) {
            return Optional.of("image/webp");
        }
        return Optional.empty();
    }

    public static String sha256(byte[] content) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(content));
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException("Every JVM provides SHA-256.", impossible);
        }
    }

    /**
     * Stores a photo unless the same bytes are already stored.
     *
     * @return true when this call stored it, false when it was there already
     */
    public boolean store(String sha256, byte[] content, String contentType, String uploadedBy) {
        if (exists(sha256)) {
            return false;
        }
        GridFSUploadOptions options = new GridFSUploadOptions()
                .metadata(new Document(CONTENT_TYPE, contentType).append(UPLOADED_BY, uploadedBy));
        bucket.uploadFromStream(sha256, new ByteArrayInputStream(content), options);
        return true;
    }

    public boolean exists(String sha256) {
        return bucket.find(Filters.eq("filename", sha256)).first() != null;
    }

    public Optional<ProductPhoto> load(String sha256) {
        GridFSFile file = bucket.find(Filters.eq("filename", sha256)).first();
        if (file == null) {
            return Optional.empty();
        }
        ByteArrayOutputStream content = new ByteArrayOutputStream((int) file.getLength());
        bucket.downloadToStream(file.getObjectId(), content);
        Document metadata = file.getMetadata();
        String contentType = metadata == null ? null : metadata.getString(CONTENT_TYPE);
        return Optional.of(new ProductPhoto(content.toByteArray(), contentType));
    }

    /** Deletes every stored copy of a photo. A photo that is not stored is ignored. */
    public void delete(String sha256) {
        for (GridFSFile file : bucket.find(Filters.eq("filename", sha256))) {
            bucket.delete(file.getObjectId());
        }
    }

    private static boolean startsWith(byte[] content, int offset, int[] expected) {
        if (content.length < offset + expected.length) {
            return false;
        }
        for (int i = 0; i < expected.length; i++) {
            if ((content[offset + i] & 0xFF) != expected[i]) {
                return false;
            }
        }
        return true;
    }

    private static int[] ascii(String text) {
        byte[] bytes = text.getBytes(StandardCharsets.US_ASCII);
        int[] values = new int[bytes.length];
        for (int i = 0; i < bytes.length; i++) {
            values[i] = bytes[i];
        }
        return values;
    }
}
