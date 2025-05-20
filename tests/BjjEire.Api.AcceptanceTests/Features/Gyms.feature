Feature: BJJ Gym API - Search and Exploration
  As a BJJ practitioner or enthusiast
  I want to interact with the BJJ Gym API
  So that I can programmatically access gym information across Ireland.

  Background:
    Given the API endpoint "/gyms" is available

  @api @gyms @smoke
  Scenario: Retrieve a list of gyms for a specific county
    When I send a GET request to "/gyms" with query parameter "county=Dublin"
    Then the response status code should be 200
    And the response should contain a list of gyms, with a maximum of 20 gyms
    And each gym object in the list should include "name", "location_coordinates", "timetable_url", "social_media_links", and "website_url"
    And the response time should be under 2000 milliseconds

  @api @gyms
  Scenario: Retrieve a list of all gyms across Ireland
    When I send a GET request to "/gyms" with query parameter "county=All"
    Then the response status code should be 200
    And the response should contain a list of gyms, with a maximum of 20 gyms from any county
    And each gym object in the list should include "name", "location_coordinates", "timetable_url", "social_media_links", and "website_url"
    And the response time should be under 2000 milliseconds

  @api @gyms @pagination
  Scenario: Retrieve the second page of gym results for a county with multiple pages
    Given there are more than 20 gyms recorded for "Cork"
    When I send a GET request to "/gyms" with query parameters "county=Cork" and "page=2"
    Then the response status code should be 200
    And the response should contain the next set of gyms for "Cork", with a maximum of 20 gyms
    And each gym object in the list should include "name", "location_coordinates", "timetable_url", "social_media_links", and "website_url"
    And the response should include pagination metadata indicating "currentPage: 2", "totalPages", and "totalResults"
    And the response time should be under 2000 milliseconds

  @api @gyms @error_handling
  Scenario: Attempt to retrieve gyms for a non-existent county
    When I send a GET request to "/gyms" with query parameter "county=NonExistentCounty"
    Then the response status code should be 404
    And the response body should indicate "No gyms found for the specified county"
    And the response time should be under 1000 milliseconds

  @api @gyms @pagination @error_handling
  Scenario: Attempt to retrieve an invalid page number
    Given there are gyms recorded for "Dublin"
    When I send a GET request to "/gyms" with query parameters "county=Dublin" and "page=999" # Assuming 999 is an out-of-bounds page
    Then the response status code should be 404
    And the response body should indicate "Invalid page number" or "No results for this page"
    And the response time should be under 1000 milliseconds

  @api @gyms
  Scenario Outline: Retrieve gyms ensuring specific data fields are present for various counties
    When I send a GET request to "/gyms" with query parameter "county=<county_name>"
    Then the response status code should be 200
    And if gyms are found for "<county_name>", each gym object must include "name" and "website_url"

    Examples:
      | county_name |
      | Galway      |
      | Limerick    |
      | Waterford   |