variable "application_display_name" {
  description = "The display name for the Azure AD application."
  type        = string
}

variable "aks_oidc_issuer_url" {
  description = "The OIDC issuer URL from the AKS cluster."
  type        = string
}

variable "kubernetes_namespace" {
  description = "The Kubernetes namespace where the service account is defined."
  type        = string
}

variable "kubernetes_service_account" {
  description = "The Kubernetes service account name that will use workload identity."
  type        = string
}

variable "scope" {
  description = "The scope (resource ID) to which the role assignment applies."
  type        = string
}

variable "role_definition_name" {
  description = "The name of the role definition to assign (e.g., 'AcrPull', 'Storage Blob Data Reader')."
  type        = string
}

variable "principal_type" {
  description = "The type of principal to assign the role to (e.g., 'ServicePrincipal')."
  type        = string
}
