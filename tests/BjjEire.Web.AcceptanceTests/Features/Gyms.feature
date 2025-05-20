Feature: BJJ Gym UI - Search, Filter, and Explore
  As a user of the Irish BJJ app
  I want to easily search, filter, and explore BJJ gyms
  So that I can find suitable gyms and access their resources quickly.

  Background:
    Given I am on the "Gyms" page of the  BJJ Eire app

  @ui @gyms @smoke
  Scenario: Search for gyms by a specific county and view results
    When I select "Dublin" from the "County" filter dropdown
    And I click the "Find Gyms" button
    Then I should see a grid displaying up to 20 gym cards for gyms located in "Dublin"
    And each displayed gym card should show the gym's name
    And each displayed gym card should have a "View on Map" link opening Google Maps with the gym's location
    And each displayed gym card should have a "Timetable" link directing to the gym's timetable page or website
    And each displayed gym card should have links for "Facebook", "Instagram", or other relevant social media if available
    And each displayed gym card should have a "Visit Website" button linking to the gym's official website

  @ui @gyms
  Scenario: View all gyms across Ireland without a specific county filter
    When I select "All Counties" from the "County" filter dropdown
    And I click the "Find Gyms" button
    Then I should see a grid displaying up to 20 gym cards for gyms from various counties in Ireland

  @ui @gyms @pagination
  Scenario: Navigate to the next page of gym results
    Given I have performed a search for gyms in "Cork"
    And the search results for "Cork" span multiple pages
    When I click the "Next Page" button in the pagination controls
    Then I should see the subsequent set of up to 20 gym cards for "Cork"
    And the pagination controls should indicate that I am on page "2"

  @ui @gyms @no_results
  Scenario: Search for gyms in a county with no listed gyms
    When I select "Leitrim" from the "County" filter dropdown # Assuming Leitrim has no gyms for this test
    And I click the "Find Gyms" button
    Then I should see a message indicating "No gyms found matching your criteria."
    And no gym cards should be displayed

  @ui @gyms @pagination
  Scenario: Pagination controls are correctly displayed when results fit on one page
    Given I have performed a search for gyms in "Carlow"
    And the search results for "Carlow" fit entirely on a single page (e.g., 10 gyms found)
    Then the "Next Page" button in the pagination controls should be disabled or hidden
    And the "Previous Page" button in the pagination controls should be disabled or hidden

  @ui @gyms
  Scenario: Verify gym card details for the first gym in a search result
    When I select "Kilkenny" from the "County" filter dropdown
    And I click the "Find Gyms" button
    And gym results for "Kilkenny" are displayed
    Then the first gym card in the results should display its name
    And the first gym card should contain a valid "View on Map" link
