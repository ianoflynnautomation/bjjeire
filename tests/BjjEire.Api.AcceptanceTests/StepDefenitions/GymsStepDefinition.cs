// using Newtonsoft.Json.Linq;
// using Microsoft.Playwright;
// using Shouldly;
// using Reqnroll;

// namespace BjjEire.Api.AcceptanceTests.StepDefenitions;

// [Binding]
// public class GymsStepDefinition: IAsyncDisposable
// {
//     private IPlaywright _playwright;
//     private IAPIRequestContext _apiRequestContext;
//     private IAPIResponse _apiResponse;
//     private string _apiBaseUrl = "your_api_base_url";
//     private JObject _responseBody;
//     private long _responseTimeMs;

//          [BeforeScenario]
//         public async Task BeforeScenario()
//         {
//             _playwright = await Playwright.CreateAsync();
//             _apiRequestContext = await _playwright.APIRequest.NewContextAsync(new APIRequestNewContextOptions
//             {
//                 BaseURL = _apiBaseUrl,
//                 // You can set common headers, timeouts, etc. here if needed
//                 // Example: ExtraHeaders = new Dictionary<string, string> { { "Accept", "application/json" } }
//             });
//         }

//         // --- Background ---
//         [Given(@"the API endpoint ""(.*)"" is available")]
//         public void GivenTheApiEndpointIsAvailable(string endpoint)
//         {
//             // This step primarily ensures the _apiBaseUrl is set correctly for the APIRequestContext.
//             // Actual availability might be checked by a health check endpoint if desired.
//             Console.WriteLine($"API endpoint {_apiBaseUrl}{endpoint} is assumed to be available and configured.");
//         }

//         // --- Given Steps ---
//         [Given(@"there are more than (\d+) gyms recorded for ""(.*)""")]
//         public void GivenThereAreMoreThanGymsRecordedFor(int count, string county)
//         {
//             // This is a precondition. You might need to:
//             // 1. Ensure your test data meets this condition.
//             // 2. Call an endpoint (using _apiRequestContext) to verify this count if available.
//             // 3. For isolated tests, this might be an assumption or handled by data seeding.
//             Console.WriteLine($"Assuming there are more than {count} gyms recorded for {county}.");
//             // TODO: Implement logic to ensure or verify this precondition if necessary, possibly using _apiRequestContext.
//         }

//         [Given(@"there are gyms recorded for ""(.*)""")]
//         public void GivenThereAreGymsRecordedFor(string county)
//         {
//             // Similar to the above, a precondition for test data.
//             Console.WriteLine($"Assuming there are gyms recorded for {county}.");
//             // TODO: Implement logic to ensure or verify this precondition if necessary, possibly using _apiRequestContext.
//         }


//         // --- When Steps ---
//         [When(@"I send a GET request to ""(.*)"" with query parameter ""(.*)""")]
//         public async Task WhenISendAGETRequestToWithQueryParameter(string endpoint, string queryParam)
//         {
//             var fullUrl = $"{endpoint}?{queryParam}"; // Playwright context handles BaseURL
//             Console.WriteLine($"Sending GET request to: {_apiBaseUrl}{fullUrl}");
//             var stopwatch = System.Diagnostics.Stopwatch.StartNew();
//             _apiResponse = await _apiRequestContext.GetAsync(fullUrl);
//             stopwatch.Stop();
//             _responseTimeMs = stopwatch.ElapsedMilliseconds;

//             await ParseResponseBody();
//         }

//         [When(@"I send a GET request to ""(.*)"" with query parameters ""(.*)"" and ""(.*)""")]
//         public async Task WhenISendAGETRequestToWithQueryParameters(string endpoint, string queryParam1, string queryParam2)
//         {
//             var fullUrl = $"{endpoint}?{queryParam1}&{queryParam2}"; // Playwright context handles BaseURL
//             Console.WriteLine($"Sending GET request to: {_apiBaseUrl}{fullUrl}");
//             var stopwatch = System.Diagnostics.Stopwatch.StartNew();
//             _apiResponse = await _apiRequestContext.GetAsync(fullUrl);
//             stopwatch.Stop();
//             _responseTimeMs = stopwatch.ElapsedMilliseconds;

//             await ParseResponseBody();
//         }

//         private async Task ParseResponseBody()
//         {
//             _apiResponse.ShouldNotBeNull(); // Ensure we have a response object

//             // Check if the response indicates success and content type is JSON before parsing
//             // Playwright's JsonAsync() will attempt to parse regardless, but this is good practice
//             var contentType = _apiResponse.Headers.ContainsKey("content-type") ? _apiResponse.Headers["content-type"] : null;

//             try
//             {
//                 if (_apiResponse.Ok && contentType != null && contentType.Contains("application/json"))
//                 {
//                     var jsonElement = await _apiResponse.JsonAsync();
//                     if (jsonElement.HasValue)
//                     {
//                         _responseBody = JObject.Parse(jsonElement.Value.GetRawText());
//                     }
//                     else
//                     {
//                         _responseBody = new JObject(); // Empty JObject if JSON is null
//                     }
//                 }
//                 else
//                 {
//                     // Handle non-JSON or non-OK responses by storing the text
//                     var responseText = await _apiResponse.TextAsync();
//                     _responseBody = new JObject { ["text_content"] = responseText };
//                 }
//             }
//             catch (Exception ex) // Catch broader exceptions during parsing or text retrieval
//             {
//                 Console.WriteLine($"Error parsing response body: {ex.Message}");
//                 try
//                 {
//                     var responseText = await _apiResponse.TextAsync(); // Attempt to get text if JSON parsing failed
//                     _responseBody = new JObject { ["parsing_error"] = ex.Message, ["raw_text"] = responseText };
//                 }
//                 catch
//                 {
//                     _responseBody = new JObject { ["parsing_error"] = "Failed to retrieve response text after initial parsing error." };
//                 }
//             }
//         }


//         // --- Then Steps ---
//         [Then(@"the response status code should be (\d+)")]
//         public void ThenTheResponseStatusCodeShouldBe(int expectedStatusCode)
//         {
//             _apiResponse.ShouldNotBeNull();
//             _apiResponse.Status.ShouldBe(expectedStatusCode);
//             Console.WriteLine($"Verified response status code is {expectedStatusCode}.");
//         }

//         [Then(@"the response should contain a list of gyms, with a maximum of (\d+) gyms")]
//         public void ThenTheResponseShouldContainAListOfGymsWithAMaximumOfGyms(int maxGyms)
//         {
//             _responseBody.ShouldNotBeNull();
//             // Assuming the list of gyms is in a top-level array or a property like "gyms"
//             // Adjust the JPath selector (e.g., "data.gyms" or "$") as per your API response structure
//             var gymsArray = _responseBody["gyms"]as JArray ?? _responseBody as JArray;

//             gymsArray.ShouldNotBeNull("Gyms array was not found in the response or response body is not an array.");
//             gymsArray.Count.ShouldBeLessThanOrEqualTo(maxGyms, $"Expected max {maxGyms} gyms, but found {gymsArray.Count}.");
//             Console.WriteLine($"Verified response contains a list of {gymsArray.Count} gyms (max {maxGyms}).");
//         }

//         [Then(@"the response should contain a list of gyms, with a maximum of (\d+) gyms from any county")]
//         public void ThenTheResponseShouldContainAListOfGymsWithAMaximumOfGymsFromAnyCounty(int maxGyms)
//         {
//             // This is essentially the same as the previous step for this API structure.
//             // If the structure for "All" counties was different, this might need a distinct implementation.
//             ThenTheResponseShouldContainAListOfGymsWithAMaximumOfGyms(maxGyms);
//         }


//         [Then(@"each gym object in the list should include ""(.*)"", ""(.*)"", ""(.*)"", ""(.*)"", and ""(.*)""")]
//         public void ThenEachGymObjectInTheListShouldIncludeAnd(string field1, string field2, string field3, string field4, string field5)
//         {
//             _responseBody.ShouldNotBeNull();
//             var gymsArray = _responseBody["gyms"] as JArray ?? _responseBody as JArray;
//             gymsArray.ShouldNotBeNull("Gyms array was not found in the response.");

//             var expectedFields = new List<string> { field1, field2, field3, field4, field5 };

//             if (!gymsArray.Any())
//             {
//                 Console.WriteLine("Gyms array is empty, skipping field check for individual gyms.");
//                 // Depending on requirements, an empty array might be acceptable or an error.
//                 // For this step, if it's empty, the loop won't run, and it passes.
//                 return;
//             }

//             foreach (var gymToken in gymsArray)
//             {
//                 var gym = gymToken as JObject;
//                 gym.ShouldNotBeNull("A gym token in the array was not a JObject.");
//                 foreach (var field in expectedFields)
//                 {
//                     gym.ContainsKey(field).ShouldBeTrue($"Gym object is missing field: {field}. Gym: {gym.ToString()}");
//                     gym[field].ShouldNotBeNull($"Field '{field}' in gym object should not be null. Gym: {gym.ToString()}");
//                 }
//             }
//             Console.WriteLine($"Verified each gym object includes the specified fields: {string.Join(", ", expectedFields)}.");
//         }

//         [Then(@"the response time should be under (\d+) milliseconds")]
//         public void ThenTheResponseTimeShouldBeUnderMilliseconds(long expectedMaxResponseTimeMs)
//         {
//             _responseTimeMs.ShouldBeLessThan(expectedMaxResponseTimeMs, $"Expected response time under {expectedMaxResponseTimeMs}ms, but was {_responseTimeMs}ms.");
//             Console.WriteLine($"Verified response time ({_responseTimeMs}ms) is under {expectedMaxResponseTimeMs}ms.");
//         }

//         [Then(@"the response should contain the next set of gyms for ""(.*)"", with a maximum of (\d+) gyms")]
//         public void ThenTheResponseShouldContainTheNextSetOfGymsForWithAMaximumOfGyms(string county, int maxGyms)
//         {
//             // This step might involve checking if the gyms are indeed from the specified county if not already guaranteed by the query.
//             // For now, it's similar to the general list check.
//             ThenTheResponseShouldContainAListOfGymsWithAMaximumOfGyms(maxGyms);
//             Console.WriteLine($"Verified response contains gyms for {county} (specific content check might be needed).");
//             // TODO: Add specific checks if the response structure for paginated county results differs or needs county verification (e.g., check a 'county' field in each gym object).
//         }

//         [Then(@"the response should include pagination metadata indicating ""(.*)"", ""(.*)"", and ""(.*)""")]
//         public void ThenTheResponseShouldIncludePaginationMetadataIndicatingAnd(string currentPageInfo, string totalPagesInfo, string totalResultsInfo)
//         {
//             _responseBody.ShouldNotBeNull();
//             // Assuming pagination metadata is in a "pagination" object. Adjust JPath as needed.
//             var paginationObj = _responseBody["pagination"] as JObject;
//             paginationObj.ShouldNotBeNull("Pagination object was not found in the response.");

//             // Example parsing for "currentPage: 2"
//             var currentPageParts = currentPageInfo.Split(':');
//             var expectedCurrentPageKey = currentPageParts[0].Trim();
//             var expectedCurrentPageValue = int.Parse(currentPageParts[1].Trim());

//             paginationObj.ContainsKey(expectedCurrentPageKey).ShouldBeTrue($"Pagination metadata missing '{expectedCurrentPageKey}'.");
//             ((int)paginationObj[expectedCurrentPageKey]).ShouldBe(expectedCurrentPageValue);

//             paginationObj.ContainsKey(totalPagesInfo).ShouldBeTrue($"Pagination metadata missing '{totalPagesInfo}'.");
//             paginationObj.ContainsKey(totalResultsInfo).ShouldBeTrue($"Pagination metadata missing '{totalResultsInfo}'.");

//             ((int)paginationObj[totalPagesInfo]).ShouldBeGreaterThanOrEqualTo(expectedCurrentPageValue, "Total pages should be greater than or equal to current page.");
//             ((int)paginationObj[totalResultsInfo]).ShouldBeGreaterThan(0, "Total results should be greater than 0 for paginated results unless it's an empty set on a valid page.");

//             Console.WriteLine($"Verified pagination metadata: {currentPageInfo}, {totalPagesInfo} exists, {totalResultsInfo} exists.");
//         }

//         [Then(@"the response body should indicate ""(.*)""")]
//         public async Task ThenTheResponseBodyShouldIndicate(string expectedMessage)
//         {
//             _apiResponse.ShouldNotBeNull();
//             var responseString = await _apiResponse.TextAsync(); // Get the full text content

//             responseString.ShouldNotBeNullOrEmpty("Response body was null or empty.");
//             responseString.ShouldContain(expectedMessage, Case.Insensitive, $"Expected response body to contain '{expectedMessage}'. Actual: '{responseString}'");
//             Console.WriteLine($"Verified response body indicates: {expectedMessage}.");
//         }


//         [Then(@"if gyms are found for ""(.*)"", each gym object must include ""(.*)"" and ""(.*)""")]
//         public void ThenIfGymsAreFoundForEachGymObjectMustIncludeAnd(string countyName, string field1, string field2)
//         {
//             _responseBody.ShouldNotBeNull();
//             var gymsArray = _responseBody["gyms"] as JArray ?? _responseBody as JArray;
//             gymsArray.ShouldNotBeNull("Gyms array was not found in the response.");

//             if (!gymsArray.Any())
//             {
//                 Console.WriteLine($"No gyms found for {countyName}, skipping field check as per condition.");
//                 return; // Test passes if no gyms are found, as per "if gyms are found"
//             }

//             var expectedFields = new List<string> { field1, field2 };
//             Console.WriteLine($"Gyms found for {countyName}. Verifying fields: {string.Join(", ", expectedFields)}.");

//             foreach (var gymToken in gymsArray)
//             {
//                 var gym = gymToken as JObject;
//                 gym.ShouldNotBeNull("A gym token in the array was not a JObject.");
//                 foreach (var field in expectedFields)
//                 {
//                     gym.ContainsKey(field).ShouldBeTrue($"Gym object for {countyName} is missing field: {field}. Gym: {gym.ToString()}");
//                     gym[field].ShouldNotBeNull($"Field '{field}' in gym object for {countyName} should not be null. Gym: {gym.ToString()}");
//                 }
//             }
//             Console.WriteLine($"Verified each gym object for {countyName} includes the specified fields.");
//         }
//         public async ValueTask DisposeAsync()
//         {
//             if (_apiRequestContext != null)
//             {
//                 await _apiRequestContext.DisposeAsync();
//             }
//             _playwright?.Dispose();
//             // Suppress finalization.
//             GC.SuppressFinalize(this);
//         }
//     }


// }
