using System.Globalization;
using System.Text;

namespace BjjEire.Application.Features.Competitions.Caching;

public static class CompetitionCacheKeys
{
    public const string Tag = "competitions";

    private static readonly CompositeFormat AllComposite = CompositeFormat.Parse("Competitions_All_Page{0}_PageSize{1}_IncludeInactive{2}");

    public static string All(int page, int pageSize, bool includeInactive)
        => string.Format(CultureInfo.InvariantCulture, AllComposite, page, pageSize, includeInactive);
}
