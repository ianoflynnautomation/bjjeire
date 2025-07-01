output "client_id" {
  description = "The Client ID of the Azure AD application for workload identity."
  value       = azuread_application.app.client_id
}

output "service_principal_id" {
  description = "The Object ID of the Azure AD service principal for workload identity."
  value       = azuread_service_principal.sp.id
}
