using System.Globalization;
using System.Text;

using BjjEire.Domain.Enums;

namespace BjjEire.Application.Common.Constants;

public static class CacheKey
{
    public const string GymsTag = "gyms";
    public const string BjjEventsTag = "bjjevents";

    private static readonly CompositeFormat BjjEventsAllComposite = CompositeFormat.Parse("BjjEvents_All_Page{0}_PageSize{1}_County{2}_Type{3}");
    private static readonly CompositeFormat BjjEventsByIdComposite = CompositeFormat.Parse("BjjEvents_Id{0}");
    private static readonly CompositeFormat GymAllComposite = CompositeFormat.Parse("Gyms_All_Page{0}_PageSize{1}_County{2}");
    private static readonly CompositeFormat GymByIdComposite = CompositeFormat.Parse("Gym_Id{0}");

    public static string BjjEventsAll(int page, int pageSize, County? county, BjjEventType? type)
    {
        var countyCachePart = (county?.ToString() ?? "None").ToLowerInvariant();
        var typeCachePart = (type?.ToString() ?? "None").ToLowerInvariant();
        return string.Format(CultureInfo.InvariantCulture, BjjEventsAllComposite, page, pageSize, countyCachePart, typeCachePart);
    }

    public static string BjjEventsById(string id)
    {
        ArgumentNullException.ThrowIfNull(id);
        return string.Format(CultureInfo.InvariantCulture, BjjEventsByIdComposite, id);
    }

    public static string GymsAll(int page, int pageSize, County? county)
    {
        var countyCachePart = (county?.ToString() ?? "None").ToLowerInvariant();
        return string.Format(CultureInfo.InvariantCulture, GymAllComposite, page, pageSize, countyCachePart);
    }

    public static string GymById(string id)
    {
        ArgumentNullException.ThrowIfNull(id);
        return string.Format(CultureInfo.InvariantCulture, GymByIdComposite, id);
    }
}
