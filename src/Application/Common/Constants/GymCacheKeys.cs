
namespace BjjWorld.Application.Common.Constants;

public static partial class CacheKey
{
        public static string BJJ_EVENT_PATTERN_KEY => "BjjEvent.";
        public static string BJJ_EVENT_BY_ID_KEY => "BjjEvent.id-{0}";
        public static string BJJ_EVENT_ALL => "BjjEvent.all-{0}-{1}-{2}-{3}";
        
        public static string GYM_PATTERN_KEY => "Gym.";
        public static string GYM_BY_ID_KEY => "Gym.id-{0}";
        public static string GYM_ALL => "Gym.all-{0}-{1}-{2}";

//     private const string BjjEventPrefix = "BjjEvent";
//     public static string BjjEventPattern => $"{BjjEventPrefix}:*";
//     public static string GetBjjEventByIdKey(string id) => $"{BjjEventPrefix}:Id:{id}";

//     public static string GetAllBjjEventsKey(int page, int pageSize, string? city, string? type)
//     {
//         // Normalize inputs for consistent cache keys
//         var cityKeyPart = string.IsNullOrWhiteSpace(city) ? "all" : city.ToLowerInvariant();
//         var typeKeyPart = type?.ToString().ToLowerInvariant() ?? "all";
//         return $"{BjjEventPrefix}:All:P{page}-PS{pageSize}-C{cityKeyPart}-T{typeKeyPart}";
//     }
    
}