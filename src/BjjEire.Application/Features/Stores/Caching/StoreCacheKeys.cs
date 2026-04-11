using System.Globalization;
using System.Text;

namespace BjjEire.Application.Features.Stores.Caching;

public static class StoreCacheKeys
{
    public const string Tag = "stores";

    private static readonly CompositeFormat AllComposite = CompositeFormat.Parse("Stores_All_Page{0}_PageSize{1}");

    public static string All(int page, int pageSize)
        => string.Format(CultureInfo.InvariantCulture, AllComposite, page, pageSize);
}
