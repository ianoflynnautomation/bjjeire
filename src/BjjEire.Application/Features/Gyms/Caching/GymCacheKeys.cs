using System.Globalization;
using System.Text;

using BjjEire.Domain.Enums;

namespace BjjEire.Application.Features.Gyms.Caching;

public static class GymCacheKeys
{
    public const string Tag = "gyms";

    private static readonly CompositeFormat AllComposite = CompositeFormat.Parse("Gyms_All_Page{0}_PageSize{1}_County{2}");
    private static readonly CompositeFormat ByIdComposite = CompositeFormat.Parse("Gym_Id{0}");

    public static string All(int page, int pageSize, County? county)
    {
        var countyCachePart = (county?.ToString() ?? "None").ToLowerInvariant();
        return string.Format(CultureInfo.InvariantCulture, AllComposite, page, pageSize, countyCachePart);
    }

    public static string ById(string id)
    {
        ArgumentNullException.ThrowIfNull(id);
        return string.Format(CultureInfo.InvariantCulture, ByIdComposite, id);
    }
}
