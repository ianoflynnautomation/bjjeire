variable "subscription_id" {
  description = "Specifies the Azure subscription ID."
  type        = string
  validation {
    condition     = length(var.subscription_id) > 0
    error_message = "The subscription_id cannot be empty."
  }
}

variable "project_prefix" {
  description = "A short prefix used for naming all resources to ensure uniqueness and organization."
  type        = string
  default     = "bjjeire"
  validation {
    condition     = length(var.project_prefix) > 0 && length(var.project_prefix) <= 10 && can(regex("^[a-z0-9]+$", var.project_prefix))
    error_message = "The project_prefix must be lowercase alphanumeric and between 1 and 10 characters."
  }
}

variable "aks_cluster_name" {
  description = "(Required) Specifies the name of the AKS cluster."
  default     = "aks"
  type        = string
  validation {
    condition     = length(var.aks_cluster_name) > 0 && length(var.aks_cluster_name) <= 20 && can(regex("^[a-z0-9-]+$", var.aks_cluster_name))
    error_message = "The aks_cluster_name must be lowercase alphanumeric, hyphens allowed, and between 1 and 20 characters."
  }
}

variable "location" {
  description = "Specifies the Azure region for the resource group and all resources."
  default     = "switzerlandnorth"
  type        = string
  validation {
    condition     = contains(["northeurope", "westeurope", "eastus", "centralus", "uksouth"], var.location)
    error_message = "The specified location is not supported or is misspelled."
  }
}

variable "kubernetes_version" {
  description = "Specifies the AKS Kubernetes version."
  default     = "1.33.2"
  type        = string
  validation {
    condition     = can(regex("^1\\.\\d{2}\\.\\d+$", var.kubernetes_version))
    error_message = "The Kubernetes version must be in the format '1.XX.Y'."
  }
}

variable "automatic_channel_upgrade" {
  description = "(Optional) The upgrade channel for this Kubernetes Cluster. Possible values are patch, rapid, and stable."
  default     = "stable"
  type        = string
  validation {
    condition     = contains(["patch", "rapid", "stable", "node-image"], var.automatic_channel_upgrade)
    error_message = "The upgrade channel is invalid. Possible values are patch, rapid, stable, node-image."
  }
}

variable "sku_tier" {
  description = "(Optional) The SKU Tier that should be used for this Kubernetes Cluster. Possible values are Free and Paid (which includes the Uptime SLA). Defaults to Free."
  default     = "Free"
  type        = string
  validation {
    condition     = contains(["Free", "Paid"], var.sku_tier)
    error_message = "The SKU tier is invalid. Possible values are Free, Paid."
  }
}

variable "default_node_pool_name" {
  description = "Specifies the name of the default node pool."
  default     = "systempool"
  type        = string
  validation {
    condition     = length(var.default_node_pool_name) > 0 && length(var.default_node_pool_name) <= 12 && can(regex("^[a-z0-9]+$", var.default_node_pool_name))
    error_message = "The default_node_pool_name must be lowercase alphanumeric and between 1 and 12 characters."
  }
}

variable "default_node_pool_vm_size" {
  description = "Specifies the VM size of the default node pool."
  default     = "Standard_DS2_v2"
  type        = string
  validation {
    condition     = can(regex("^Standard_[A-Za-z0-9_]+$", var.default_node_pool_vm_size))
    error_message = "The VM size format is invalid. It should start with 'Standard_'."
  }
}

variable "default_node_pool_subnet_name" {
  description = "Specifies the name of the subnet that hosts the default node pool."
  default     = "system-subnet"
  type        = string
}

variable "default_node_pool_availability_zones" {
  description = "Specifies the availability zones of the default node pool."
  default     = ["1", "2", "3"]
  type        = list(string)
  validation {
    condition     = all([for zone in var.default_node_pool_availability_zones : contains(["1", "2", "3"], zone)])
    error_message = "Availability zones must be '1', '2', or '3'."
  }
}

variable "default_node_pool_node_labels" {
  description = "(Optional) A map of Kubernetes labels which should be applied to nodes in this Node Pool."
  type        = map(string)
  default     = {}
}

variable "default_node_pool_node_taints" {
  description = "(Optional) A list of Kubernetes taints which should be applied to nodes in the agent pool (e.g key=value:NoSchedule)."
  type        = list(string)
  default     = ["CriticalAddonsOnly=true:NoSchedule"]
}

variable "default_node_pool_enable_auto_scaling" {
  description = "(Optional) Whether to enable auto-scaler. Defaults to true."
  type        = bool
  default     = true
}

variable "default_node_pool_enable_host_encryption" {
  description = "(Optional) Should the nodes in this Node Pool have host encryption enabled? Defaults to false."
  type        = bool
  default     = false
}

variable "default_node_pool_enable_node_public_ip" {
  description = "(Optional) Should each node have a Public IP Address? Defaults to false. Changing this forces a new resource to be created."
  type        = bool
  default     = false
}

variable "default_node_pool_max_pods" {
  description = "(Optional) The maximum number of pods that can run on each agent. Changing this forces a new resource to be created."
  type        = number
  default     = 50
  validation {
    condition     = var.default_node_pool_max_pods >= 10 && var.default_node_pool_max_pods <= 250
    error_message = "max_pods must be between 10 and 250."
  }
}

variable "default_node_pool_os_disk_type" {
  description = "(Optional) The type of disk which should be used for the Operating System. Possible values are Ephemeral and Managed. Defaults to Managed. Changing this forces a new resource to be created."
  type        = string
  default     = "Ephemeral"
  validation {
    condition     = contains(["Ephemeral", "Managed"], var.default_node_pool_os_disk_type)
    error_message = "The OS disk type is invalid. Possible values are Ephemeral, Managed."
  }
}

variable "default_node_pool_max_count" {
  description = "(Required) The maximum number of nodes which should exist within this Node Pool. Valid values are between 0 and 1000 and must be greater than or equal to min_count."
  type        = number
  default     = 5
  validation {
    condition     = var.default_node_pool_max_count >= var.default_node_pool_min_count && var.default_node_pool_max_count <= 1000
    error_message = "max_count must be greater than or equal to min_count and less than or equal to 1000."
  }
}

variable "default_node_pool_min_count" {
  description = "(Required) The minimum number of nodes which should exist within this Node Pool. Valid values are between 0 and 1000 and must be less than or equal to max_count."
  type        = number
  default     = 1
  validation {
    condition     = var.default_node_pool_min_count >= 0 && var.default_node_pool_min_count <= var.default_node_pool_max_count
    error_message = "min_count must be greater than or equal to 0 and less than or equal to max_count."
  }
}

variable "default_node_pool_node_count" {
  description = "(Optional) The initial number of nodes which should exist within this Node Pool. Valid values are between 0 and 1000 and must be a value in the range min_count - max_count."
  type        = number
  default     = 1
  validation {
    condition     = var.default_node_pool_node_count >= var.default_node_pool_min_count && var.default_node_pool_node_count <= var.default_node_pool_max_count
    error_message = "node_count must be within the range of min_count and max_count."
  }
}

variable "network_dns_service_ip" {
  description = "Specifies the DNS service IP for the Kubernetes cluster."
  default     = "10.2.0.10"
  type        = string
  validation {
    condition     = can(regex("^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}$", var.network_dns_service_ip))
    error_message = "network_dns_service_ip must be a valid IP address."
  }
}

variable "network_plugin" {
  description = "Specifies the network plugin of the AKS cluster. Possible values are 'azure' (Azure CNI) and 'kubenet'."
  default     = "azure"
  type        = string
  validation {
    condition     = contains(["azure", "kubenet"], var.network_plugin)
    error_message = "The network_plugin is invalid. Possible values are 'azure', 'kubenet'."
  }
}

variable "network_service_cidr" {
  description = "Specifies the service CIDR for the Kubernetes cluster."
  default     = "10.2.0.0/24"
  type        = string
  validation {
    condition     = can(regex("^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\/\\d{1,2}$", var.network_service_cidr))
    error_message = "network_service_cidr must be a valid CIDR block."
  }
}

variable "role_based_access_control_enabled" {
  description = "(Required) Is Role Based Access Control Enabled? Changing this forces a new resource to be created."
  default     = true
  type        = bool
}

variable "admin_group_object_ids" {
  description = "(Optional) A list of Object IDs of Microsoft Entra ID Groups which should have Admin Role on the Cluster."
  default     = []
  type        = list(string)
}

variable "azure_rbac_enabled" {
  description = "(Optional) Is Role Based Access Control based on Microsoft Entra ID enabled?"
  default     = true
  type        = bool
}

variable "admin_username" {
  description = "(Required) Specifies the admin username for the jumpbox virtual machine and AKS worker nodes."
  type        = string
  default     = "azadmin"
  validation {
    condition     = length(var.admin_username) > 0 && length(var.admin_username) <= 32 && can(regex("^[a-zA-Z0-9]+$", var.admin_username))
    error_message = "The admin_username must be alphanumeric and between 1 and 32 characters."
  }
}

variable "ssh_public_key" {
  description = "(Required) Specifies the SSH public key for the jumpbox virtual machine and AKS worker nodes."
  type        = string
  validation {
    condition     = length(var.ssh_public_key) > 0
    error_message = "The SSH public key cannot be empty."
  }
}

variable "ssh_source_address_prefix" {
  description = "The source IP address prefix for SSH access to the jumpbox VM. Use '*' for any, or a specific CIDR (e.g., 'X.X.X.X/32')."
  type        = string
  default     = "*"
  validation {
    condition     = can(regex("^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\/\\d{1,2}$", var.ssh_source_address_prefix)) || var.ssh_source_address_prefix == "*"
    error_message = "ssh_source_address_prefix must be a valid CIDR block or '*'."
  }
}

variable "keda_enabled" {
  description = "(Optional) Specifies whether KEDA Autoscaler can be used for workloads."
  type        = bool
  default     = true
}

variable "vertical_pod_autoscaler_enabled" {
  description = "(Optional) Specifies whether Vertical Pod Autoscaler should be enabled."
  type        = bool
  default     = true
}

variable "workload_identity_enabled" {
  description = "(Optional) Specifies whether Microsoft Entra ID Workload Identity should be enabled for the Cluster. Defaults to false."
  type        = bool
  default     = true
}

variable "oidc_issuer_enabled" {
  description = "(Optional) Enable or Disable the OIDC issuer URL."
  type        = bool
  default     = true
}

variable "open_service_mesh_enabled" {
  description = "(Optional) Is Open Service Mesh enabled? For more details, please visit Open Service Mesh for AKS."
  type        = bool
  default     = true
}

variable "image_cleaner_enabled" {
  description = "(Optional) Specifies whether Image Cleaner is enabled."
  type        = bool
  default     = true
}

variable "azure_policy_enabled" {
  description = "(Optional) Should the Azure Policy Add-On be enabled? For more details please visit Understand Azure Policy for Azure Kubernetes Service."
  type        = bool
  default     = true
}

variable "http_application_routing_enabled" {
  description = "(Optional) Should HTTP Application Routing be enabled?"
  type        = bool
  default     = false
}

variable "log_analytics_workspace_name" {
  description = "Specifies the name of the log analytics workspace."
  default     = "log-analytics-ws"
  type        = string
  validation {
    condition     = length(var.log_analytics_workspace_name) > 0 && length(var.log_analytics_workspace_name) <= 30 && can(regex("^[a-z0-9-]+$", var.log_analytics_workspace_name))
    error_message = "The log_analytics_workspace_name must be lowercase alphanumeric, hyphens allowed, and between 1 and 30 characters."
  }
}

variable "solution_plan_map" {
  description = "Specifies solutions to deploy to log analytics workspace."
  default = {
    ContainerInsights = {
      publisher = "Microsoft"
      product   = "OMSGallery/ContainerInsights"
    }
  }
  type = map(any)
}

variable "aks_vnet_name" {
  description = "Specifies the name of the AKS virtual network."
  default     = "aks-vnet"
  type        = string
}

variable "aks_vnet_address_space" {
  description = "Specifies the address prefix of the AKS virtual network."
  default     = ["10.0.0.0/16"]
  type        = list(string)
  validation {
    condition     = all([for cidr in var.aks_vnet_address_space : can(regex("^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\/\\d{1,2}$", cidr))])
    error_message = "aks_vnet_address_space must contain valid CIDR blocks."
  }
}

variable "default_node_pool_subnet_address_prefix" {
  description = "Specifies the address prefix of the subnet that hosts the default node pool."
  default     = ["10.0.0.0/20"]
  type        = list(string)
  validation {
    condition     = all([for cidr in var.default_node_pool_subnet_address_prefix : can(regex("^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\/\\d{1,2}$", cidr))])
    error_message = "default_node_pool_subnet_address_prefix must contain valid CIDR blocks."
  }
}

variable "additional_node_pool_subnet_name" {
  description = "Specifies the name of the subnet for additional node pools."
  default     = "user-subnet"
  type        = string
}

variable "additional_node_pool_subnet_address_prefix" {
  description = "Specifies the address prefix of the subnet that hosts the additional node pool."
  type        = list(string)
  default     = ["10.0.16.0/20"]
  validation {
    condition     = all([for cidr in var.additional_node_pool_subnet_address_prefix : can(regex("^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\/\\d{1,2}$", cidr))])
    error_message = "additional_node_pool_subnet_address_prefix must contain valid CIDR blocks."
  }
}

variable "pod_subnet_name" {
  description = "Specifies the name of the pod subnet (for Azure CNI)."
  default     = "pod-subnet"
  type        = string
}

variable "pod_subnet_address_prefix" {
  description = "Specifies the address prefix of the pod subnet (for Azure CNI)."
  type        = list(string)
  default     = ["10.0.32.0/20"]
  validation {
    condition     = all([for cidr in var.pod_subnet_address_prefix : can(regex("^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\/\\d{1,2}$", cidr))])
    error_message = "pod_subnet_address_prefix must contain valid CIDR blocks."
  }
}

variable "acr_name" {
  description = "Specifies the base name of the container registry. Will be prefixed."
  type        = string
  default     = "acr"
  validation {
    condition     = length(var.acr_name) > 0 && length(var.acr_name) <= 10 && can(regex("^[a-z0-9]+$", var.acr_name))
    error_message = "The acr_name must be lowercase alphanumeric and between 1 and 10 characters."
  }
}

variable "acr_sku" {
  description = "Specifies the SKU of the container registry."
  type        = string
  default     = "Premium"
  validation {
    condition     = contains(["Basic", "Standard", "Premium"], var.acr_sku)
    error_message = "The container registry SKU is invalid. Possible values are Basic, Standard, Premium."
  }
}

variable "acr_admin_enabled" {
  description = "Specifies whether admin is enabled for the container registry."
  type        = bool
  default     = false
}

variable "acr_georeplication_locations" {
  description = "(Optional) A list of Azure locations where the container registry should be geo-replicated."
  type        = list(string)
  default     = []
}

variable "vm_subnet_name" {
  description = "Specifies the name of the jumpbox subnet within the AKS VNet."
  default     = "jumpbox-subnet"
  type        = string
}

variable "helm_chart_name" {
  description = "Name of the Helm chart to deploy (e.g., 'nginx')."
  type        = string
  default     = "bjj-app"
}

variable "helm_chart_version" {
  description = "Version of the Helm chart to deploy (e.g., '15.0.0')."
  type        = string
  default     = "0.1.0"
}

variable "helm_release_name" {
  description = "Name of the Helm release."
  type        = string
  default     = "bjj-app"
}

variable "helm_namespace" {
  description = "Kubernetes namespace to deploy the Helm chart into."
  type        = string
  default     = "bjj-app"
}

variable "helm_create_namespace" {
  description = "Whether to create the Kubernetes namespace if it doesn't exist."
  type        = bool
  default     = true
}

variable "helm_values_file_path" {
  description = "Path to the Helm values.yaml file. Leave empty if not using a separate file."
  type        = string
  default     = "../../charts/bjj-app/values-aks.yaml"
}

variable "helm_set_values" {
  description = "A list of key-value pairs to set in the Helm chart (e.g., [\"service.type=LoadBalancer\", \"replicaCount=3\"])."
  type        = list(string)
  default     = []
}

variable "key_vault_name" {
  description = "Specifies the base name of the key vault. Will be prefixed and suffixed."
  type        = string
  default     = "kv"
  validation {
    condition     = length(var.key_vault_name) > 0 && length(var.key_vault_name) <= 10 && can(regex("^[a-z0-9-]+$", var.key_vault_name))
    error_message = "The key_vault_name must be lowercase alphanumeric, hyphens allowed, and between 1 and 10 characters."
  }
}

variable "key_vault_sku_name" {
  description = "(Required) The Name of the SKU used for this Key Vault. Possible values are standard and premium."
  type        = string
  default     = "standard"
  validation {
    condition     = contains(["standard", "premium"], var.key_vault_sku_name)
    error_message = "The SKU name of the key vault is invalid. Possible values are standard, premium."
  }
}

variable "key_vault_enabled_for_deployment" {
  description = "(Optional) Boolean flag to specify whether Azure Virtual Machines are permitted to retrieve certificates stored as secrets from the key vault. Defaults to false."
  type        = bool
  default     = true
}

variable "key_vault_enabled_for_disk_encryption" {
  description = " (Optional) Boolean flag to specify whether Azure Disk Encryption is permitted to retrieve secrets from the vault and unwrap keys. Defaults to false."
  type        = bool
  default     = true
}

variable "key_vault_enabled_for_template_deployment" {
  description = "(Optional) Boolean flag to specify whether Azure Resource Manager is permitted to retrieve secrets from the key vault. Defaults to false."
  type        = bool
  default     = true
}

variable "key_vault_enable_rbac_authorization" {
  description = "(Optional) Boolean flag to specify whether Azure Key Vault uses Role Based Access Control (RBAC) for authorization of data actions. Defaults to false."
  type        = bool
  default     = true
}

variable "key_vault_purge_protection_enabled" {
  description = "(Optional) Is Purge Protection enabled for this Key Vault? Defaults to false."
  type        = bool
  default     = true
}

variable "key_vault_soft_delete_retention_days" {
  description = "(Optional) The number of days that items should be retained for once soft-deleted. This value can be between 7 and 90 (the default) days."
  type        = number
  default     = 30
  validation {
    condition     = var.key_vault_soft_delete_retention_days >= 7 && var.key_vault_soft_delete_retention_days <= 90
    error_message = "soft_delete_retention_days must be between 7 and 90."
  }
}

variable "key_vault_bypass" {
  description = "(Required) Specifies which traffic can bypass the network rules. Possible values are AzureServices and None."
  type        = string
  default     = "AzureServices"
  validation {
    condition     = contains(["AzureServices", "None"], var.key_vault_bypass)
    error_message = "The value of the bypass property of the key vault is invalid. Possible values are AzureServices, None."
  }
}

variable "key_vault_default_action" {
  description = "(Required) The Default Action to use when no rules match from ip_rules / virtual_network_subnet_ids. Possible values are Allow and Deny."
  type        = string
  default     = "Allow"
  validation {
    condition     = contains(["Allow", "Deny"], var.key_vault_default_action)
    error_message = "The value of the default action property of the key vault is invalid. Possible values are Allow, Deny."
  }
}

variable "firewall_name" {
  description = "Specifies the base name of the Azure Firewall. Will be prefixed."
  default     = "azfw"
  type        = string
  validation {
    condition     = length(var.firewall_name) > 0 && length(var.firewall_name) <= 10 && can(regex("^[a-z0-9-]+$", var.firewall_name))
    error_message = "The firewall_name must be lowercase alphanumeric, hyphens allowed, and between 1 and 10 characters."
  }
}

variable "firewall_sku_name" {
  description = "(Required) SKU name of the Firewall. Possible values are AZFW_Hub and AZFW_VNet. Changing this forces a new resource to be created."
  default     = "AZFW_VNet"
  type        = string
  validation {
    condition     = contains(["AZFW_Hub", "AZFW_VNet"], var.firewall_sku_name)
    error_message = "The value of the SKU name property of the firewall is invalid. Possible values are AZFW_Hub, AZFW_VNet."
  }
}

variable "firewall_sku_tier" {
  description = "(Required) SKU tier of the Firewall. Possible values are Premium, Standard, and Basic."
  default     = "Standard"
  type        = string
  validation {
    condition     = contains(["Premium", "Standard", "Basic"], var.firewall_sku_tier)
    error_message = "The value of the SKU tier property of the firewall is invalid. Possible values are Premium, Standard, Basic."
  }
}

variable "firewall_threat_intel_mode" {
  description = "(Optional) The operation mode for threat intelligence-based filtering. Possible values are: Off, Alert, Deny. Defaults to Alert."
  default     = "Alert"
  type        = string
  validation {
    condition     = contains(["Off", "Alert", "Deny"], var.firewall_threat_intel_mode)
    error_message = "The threat intel mode is invalid. Possible values are Off, Alert, Deny."
  }
}

variable "firewall_zones" {
  description = "Specifies the availability zones of the Azure Firewall."
  default     = ["1", "2", "3"]
  type        = list(string)
  validation {
    condition     = all([for zone in var.firewall_zones : contains(["1", "2", "3"], zone)])
    error_message = "Firewall zones must be '1', '2', or '3'."
  }
}

variable "storage_account_kind" {
  description = "(Optional) Specifies the account kind of the storage account."
  default     = "StorageV2"
  type        = string
  validation {
    condition     = contains(["Storage", "StorageV2", "BlockBlobStorage", "FileStorage", "BlobStorage"], var.storage_account_kind) # Added more kinds
    error_message = "The account kind of the storage account is invalid."
  }
}

variable "storage_account_replication_type" {
  description = "(Optional) Specifies the replication type of the storage account."
  default     = "LRS"
  type        = string
  validation {
    condition     = contains(["LRS", "ZRS", "GRS", "GZRS", "RA-GRS", "RA-GZRS"], var.storage_account_replication_type)
    error_message = "The replication type of the storage account is invalid."
  }
}

variable "storage_account_tier" {
  description = "(Optional) Specifies the account tier of the storage account."
  default     = "Standard"
  type        = string
  validation {
    condition     = contains(["Standard", "Premium"], var.storage_account_tier)
    error_message = "The account tier of the storage account is invalid."
  }
}

variable "vm_name" {
  description = "Specifies the base name of the self-hosted agent virtual machine. Will be prefixed."
  default     = "jumpbox"
  type        = string
  validation {
    condition     = length(var.vm_name) > 0 && length(var.vm_name) <= 15 && can(regex("^[a-z0-9-]+$", var.vm_name))
    error_message = "The vm_name must be lowercase alphanumeric, hyphens allowed, and between 1 and 15 characters."
  }
}

variable "vm_size" {
  description = "Specifies the size of the self-hosted agent virtual machine."
  default     = "Standard_DS1_v2"
  type        = string
  validation {
    condition     = can(regex("^Standard_[A-Za-z0-9_]+$", var.vm_size))
    error_message = "The VM size format is invalid. It should start with 'Standard_'."
  }
}

variable "vm_public_ip" {
  description = "(Optional) Specifies whether to create a public IP for the virtual machine. Should be false for private setup."
  type        = bool
  default     = false
}

variable "vm_os_disk_storage_account_type" {
  description = "Specifies the storage account type of the OS disk of the self-hosted agent virtual machine."
  default     = "Premium_LRS"
  type        = string
  validation {
    condition     = contains(["Premium_LRS", "Premium_ZRS", "StandardSSD_LRS", "StandardSSD_ZRS", "Standard_LRS"], var.vm_os_disk_storage_account_type)
    error_message = "The storage account type of the OS disk is invalid."
  }
}

variable "vm_os_disk_image" {
  type        = map(string)
  description = "Specifies the OS disk image of the virtual machine."
  default = {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-focal"
    sku       = "20_04-lts-gen2"
    version   = "latest"
  }
  validation {
    condition     = all([for k in ["publisher", "offer", "sku", "version"] : contains(keys(var.vm_os_disk_image), k)])
    error_message = "vm_os_disk_image must contain 'publisher', 'offer', 'sku', and 'version' keys."
  }
}

variable "script_name" {
  description = "(Required) Specifies the name of the custom script to run on the jumpbox VM."
  type        = string
  default     = "configure-self-hosted-agent.sh"
}

variable "hub_vnet_address_space" {
  description = "Specifies the address space of the hub virtual network."
  default     = ["10.1.0.0/16"]
  type        = list(string)
  validation {
    condition     = all([for cidr in var.hub_vnet_address_space : can(regex("^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\/\\d{1,2}$", cidr))])
    error_message = "hub_vnet_address_space must contain valid CIDR blocks."
  }
}

variable "vm_subnet_address_prefix" {
  description = "Specifies the address prefix of the jumpbox subnet within the AKS VNet."
  default     = ["10.0.48.0/20"]
  type        = list(string)
  validation {
    condition     = all([for cidr in var.vm_subnet_address_prefix : can(regex("^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\/\\d{1,2}$", cidr))])
    error_message = "vm_subnet_address_prefix must contain valid CIDR blocks."
  }
}

variable "azure_devops_url" {
  description = "(Required) Specifies the URL of the target Azure DevOps organization."
  type        = string
  sensitive   = true
  validation {
    condition     = can(regex("^https:\\/\\/[a-zA-Z0-9-]+\\.visualstudio\\.com\\/?$", var.azure_devops_url)) || can(regex("^https:\\/\\/dev\\.azure\\.com\\/[a-zA-Z0-9-]+\\/?$", var.azure_devops_url))
    error_message = "The Azure DevOps URL is invalid. It should be in the format 'https://<org>.visualstudio.com' or '[https://dev.azure.com/](https://dev.azure.com/)<org>'."
  }
}

variable "azure_devops_pat" {
  description = "(Required) Specifies the personal access token of the target Azure DevOps organization."
  type        = string
  sensitive   = true
  validation {
    condition     = length(var.azure_devops_pat) > 0
    error_message = "The Azure DevOps PAT cannot be empty."
  }
}

variable "azure_devops_agent_pool_name" {
  description = "(Required) Specifies the name of the agent pool in the Azure DevOps organization."
  type        = string
  validation {
    condition     = length(var.azure_devops_agent_pool_name) > 0
    error_message = "The Azure DevOps agent pool name cannot be empty."
  }
}

variable "bastion_host_name" {
  description = "(Optional) Specifies the base name of the bastion host. Will be prefixed."
  default     = "bastion"
  type        = string
  validation {
    condition     = length(var.bastion_host_name) > 0 && length(var.bastion_host_name) <= 15 && can(regex("^[a-z0-9-]+$", var.bastion_host_name))
    error_message = "The bastion_host_name must be lowercase alphanumeric, hyphens allowed, and between 1 and 15 characters."
  }
}

variable "bastion_subnet_name" {
  description = "Specifies the name of the subnet for the Azure Bastion host."
  default     = "AzureBastionSubnet"
  type        = string
}

variable "hub_bastion_subnet_address_prefix" {
  description = "Specifies the address prefix of the Azure Bastion subnet in the hub VNet."
  default     = ["10.1.1.0/24"]
  type        = list(string)
  validation {
    condition     = all([for cidr in var.hub_bastion_subnet_address_prefix : can(regex("^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\/\\d{1,2}$", cidr))])
    error_message = "hub_bastion_subnet_address_prefix must contain valid CIDR blocks."
  }
}

variable "hub_vnet_name" {
  description = "Specifies the base name of the hub virtual network. Will be prefixed."
  default     = "hub-vnet"
  type        = string
}

variable "hub_address_space" {
  description = "Specifies the address space of the hub virtual network."
  default     = ["10.1.0.0/16"]
  type        = list(string)
  validation {
    condition     = all([for cidr in var.hub_address_space : can(regex("^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\/\\d{1,2}$", cidr))])
    error_message = "hub_address_space must contain valid CIDR blocks."
  }
}

variable "hub_firewall_subnet_address_prefix" {
  description = "Specifies the address prefix of the firewall subnet in the hub VNet."
  default     = ["10.1.0.0/24"]
  type        = list(string)
  validation {
    condition     = all([for cidr in var.hub_firewall_subnet_address_prefix : can(regex("^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\/\\d{1,2}$", cidr))])
    error_message = "hub_firewall_subnet_address_prefix must contain valid CIDR blocks."
  }
}

variable "management_policy_rules" {
  description = "Specifies the management policy rules for the storage account."
  type        = list(any)
  default = [
    {
      name    = "scripts_container_management_policy"
      enabled = true
      filters = {
        prefix_match = ["scripts"]
        blob_types   = ["blockBlob"]
      }
      actions = {
        base_blob = {
          tier_to_cool_after_days_since_modification_greater_than    = 30
          tier_to_archive_after_days_since_modification_greater_than = 60
          delete_after_days_since_modification_greater_than          = 90
        }
        snapshot = {
          change_tier_to_archive_after_days_since_creation = 30
          change_tier_to_cool_after_days_since_creation    = 60
          delete_after_days_since_creation_greater_than    = 90
        }
        version = {
          change_tier_to_archive_after_days_since_creation = 30
          change_tier_to_cool_after_days_since_creation    = 60
          delete_after_days_since_creation                 = 90
        }
      }
    }
  ]
}

variable "scripts_container_name" {
  description = "Specifies the name of the container where the scripts are stored in the storage account."
  type        = string
  default     = "scripts"
}

variable "workload_identity_namespace" {
  description = "The Kubernetes namespace where the service account for workload identity is located."
  type        = string
  default     = "bjj-app-namespace"
}

variable "workload_identity_service_account" {
  description = "The Kubernetes service account name that will use workload identity."
  type        = string
  default     = "bjj-app-service-account"
}
