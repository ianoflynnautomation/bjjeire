variable "chart_name" {
  description = "Name of the Helm chart to deploy."
  type        = string
}

variable "chart_version" {
  description = "Version of the Helm chart to deploy."
  type        = string
}

variable "release_name" {
  description = "Name of the Helm release."
  type        = string
}

variable "namespace" {
  description = "Kubernetes namespace to deploy the Helm chart into."
  type        = string
}

variable "create_namespace" {
  description = "Whether to create the Kubernetes namespace if it doesn't exist."
  type        = bool
  default     = true
}

variable "values_file_path" {
  description = "Path to the Helm values.yaml file. Leave empty if not using a separate file."
  type        = string
  default     = ""
}

variable "set_values" {
  description = "A list of key-value pairs to set in the Helm chart (e.g., [\"service.type=LoadBalancer\"])."
  type        = list(string)
  default     = []
}
