using System.Globalization;
using System.Text;

using BjjEire.Domain.Enums;

namespace BjjEire.Application.Features.BjjEvents.Caching;

public static class BjjEventCacheKeys
{
    public const string Tag = "bjjevents";

    private static readonly CompositeFormat AllComposite = CompositeFormat.Parse("BjjEvents_All_Page{0}_PageSize{1}_County{2}_Type{3}_IncludeInactive{4}");
    private static readonly CompositeFormat ByIdComposite = CompositeFormat.Parse("BjjEvents_Id{0}");

    public static string All(int page, int pageSize, County? county, BjjEventType? type, bool includeInactive)
    {
        string countyCachePart = (county?.ToString() ?? "None").ToLowerInvariant();
        string typeCachePart = (type?.ToString() ?? "None").ToLowerInvariant();
        return string.Format(CultureInfo.InvariantCulture, AllComposite, page, pageSize, countyCachePart, typeCachePart, includeInactive);
    }

    public static string ById(string id)
    {
        ArgumentNullException.ThrowIfNull(id);
        return string.Format(CultureInfo.InvariantCulture, ByIdComposite, id);
    }
}
