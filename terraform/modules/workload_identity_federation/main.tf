resource "azuread_application" "app" {
  display_name     = var.application_display_name
  sign_in_audience = "AzureADMyOrg"
}

resource "azuread_service_principal" "sp" {
  client_id = azuread_application.app.client_id

  depends_on = [azuread_application.app]
}

resource "azurerm_federated_identity_credential" "fic" {
  name                = "${var.application_display_name}-fic"
  resource_group_name = data.azurerm_client_config.current.resource_group_name
  parent_id           = azuread_service_principal.sp.id
  audience            = "api://AzureADTokenExchange"
  issuer              = var.aks_oidc_issuer_url
  subject             = "system:serviceaccount:${var.kubernetes_namespace}:${var.kubernetes_service_account}"

  depends_on = [azuread_service_principal.sp]
}

resource "azurerm_role_assignment" "role_assignment" {
  scope                = var.scope
  role_definition_name = var.role_definition_name
  principal_id         = azuread_service_principal.sp.id
  principal_type       = var.principal_type

  depends_on = [azurerm_federated_identity_credential.fic]
}
