Feature: Gyms

This feature is about testing gyms
ß
Rule: The price for a basket with items can be calculated based on the item prices

Scenario: Client has a simple basket
    Given the client started shopping
    And the client added 1 pcs of "Electric guitar" to the basket
    When the basket is prepared
    Then the basket price should be $180.0