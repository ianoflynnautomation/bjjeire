
using BjjEire.Domain.Enums;

namespace BjjEire.Application.Common.Constants;

public static class CacheKey
{

        private const string GymPatternKey = "Gyms_";
        private const string GymAllFormat = "Gyms_All_Page{0}_PageSize{1}_County{2}";
        private const string GymByIdFormat = "Gym_Id{0}";
        private const string BjjEventsKey = "BjjEvents_";
        private const string BjjEventsAllFormat = "BjjEvents_All_Page{0}_PageSize{1}_County{2}_Type{3}";
        private const string BjjEventsByIdFormat = "BjjEvents_Id{0}";


        public static string BjjEventsAll(int page, int pageSize, County? county, BjjEventType? type)
        {
                var countyToString = county.HasValue ? county.Value.ToString() : "None";
                string countyCachePart = string.IsNullOrWhiteSpace(countyToString) ? "None" : countyToString.Trim().ToLowerInvariant();
                var typeToString = type.ToString();
                string typeCachePart = string.IsNullOrWhiteSpace(typeToString) ? "None" : typeToString.Trim().ToLowerInvariant();
                return string.Format(BjjEventsAllFormat, page, pageSize, countyCachePart, typeCachePart);
        }

        public static string BjjEventsById(string id) => string.Format(BjjEventsByIdFormat, id);

        public static string BjjEventsByPatternKey() => string.Format(BjjEventsKey);



        public static string GymsAll(int page, int pageSize, County? county)
        {
                var countyToString = county.HasValue ? county.Value.ToString() : "None";
                string countyCachePart = string.IsNullOrWhiteSpace(countyToString) ? "None" : countyToString.Trim().ToLowerInvariant();
                return string.Format(GymAllFormat, page, pageSize, countyCachePart);
        }

        public static string GymById(string id) => string.Format(GymByIdFormat, id);

        public static string GymByPatternKey() => string.Format(GymPatternKey);

}
