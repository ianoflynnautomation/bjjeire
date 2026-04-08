

using BjjEire.Application.Common;
using BjjEire.Domain.Entities.Stores;

namespace BjjEire.Application.Features.Stores.DTOs;

public class StoreDto : BaseApiEntityModel
{
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string WebsiteUrl { get; set; } = string.Empty;

    public string? LogoUrl { get; set; }

    public bool IsActive { get; set; }
}

public class StoreDtoMapping : Profile
{
    public StoreDtoMapping()
    {
        _ = CreateMap<Store, StoreDto>()
            .ForMember(dest => dest.CreatedOnUtc, mo => mo.Ignore())
            .ForMember(dest => dest.UpdatedOnUtc, mo => mo.Ignore());
        _ = CreateMap<StoreDto, Store>()
            .ForMember(dest => dest.CreatedOnUtc, mo => mo.Ignore())
            .ForMember(dest => dest.UpdatedOnUtc, mo => mo.Ignore());

    }
}
