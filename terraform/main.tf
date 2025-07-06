data "azurerm_client_config" "current" {}

locals {
  tags = {
    createdWith = "Terraform"
    project     = var.project_prefix
  }
  storage_account_prefix = "boot"
  route_table_name       = "${var.project_prefix}-rt"
  route_name             = "RouteToAzureFirewall"
}


# ------------------------------------------------------------------------------------------------------
# Deploy resource Group
# ------------------------------------------------------------------------------------------------------

resource "random_string" "rg_suffix" {
  length  = 6
  special = false
  lower   = true
  upper   = false
}

resource "azurerm_resource_group" "rg" {
  name     = "${var.project_prefix}-rg-${random_string.rg_suffix.result}"
  location = var.location
  tags     = local.tags
}

# ------------------------------------------------------------------------------------------------------
# Deploy storage account
# ------------------------------------------------------------------------------------------------------

resource "random_string" "storage_account_suffix" {
  length  = 8
  special = false
  lower   = true
  upper   = false
}

module "storage_account" {
  source              = "./modules/storage_account"
  name                = "${local.storage_account_prefix}${random_string.storage_account_suffix.result}"
  location            = var.location
  resource_group_name = azurerm_resource_group.rg.name
  account_kind        = var.storage_account_kind
  account_tier        = var.storage_account_tier
  replication_type    = var.storage_account_replication_type
  default_action      = "Allow"
  container_name      = var.scripts_container_name
  tags                = local.tags
}

module "storage_management_policy" {
  source                  = "./modules/storage_management_policy"
  storage_account_id      = module.storage_account.id
  management_policy_rules = var.management_policy_rules
}

# ------------------------------------------------------------------------------------------------------
# Deploy network security group
# ------------------------------------------------------------------------------------------------------

module "nsg" {
  source                     = "./modules/network_security_group"
  name                       = "${var.project_prefix}-${var.vm_name}-nsg"
  location                   = var.location
  resource_group_name        = azurerm_resource_group.rg.name
  log_analytics_workspace_id = module.log_analytics_workspace.id
  tags                       = local.tags

  security_rules = [
    {
      name                       = "SSH"
      priority                   = 1001
      direction                  = "Inbound"
      access                     = "Allow"
      protocol                   = "Tcp"
      source_port_range          = "*"
      destination_port_range     = "22"
      source_address_prefix      = var.ssh_source_address_prefix
      destination_address_prefix = "*"
    },
    {
      name                       = "AllowInternetOutbound"
      priority                   = 1002
      direction                  = "Outbound"
      access                     = "Allow"
      protocol                   = "*"
      source_port_range          = "*"
      destination_port_range     = "*"
      source_address_prefix      = "*"
      destination_address_prefix = "Internet"
    }
  ]
}

# ------------------------------------------------------------------------------------------------------
# Deploy Linux vm
# ------------------------------------------------------------------------------------------------------


module "virtual_machine" {
  source                              = "./modules/virtual_machine"
  name                                = "${var.project_prefix}-${var.vm_name}"
  size                                = var.vm_size
  location                            = var.location
  public_ip                           = var.vm_public_ip
  vm_user                             = var.admin_username
  admin_ssh_public_key                = azurerm_key_vault_secret.ssh_public_key.value
  os_disk_image                       = var.vm_os_disk_image
  resource_group_name                 = azurerm_resource_group.rg.name
  subnet_id                           = module.vnet_vm.subnet_ids[var.vm_subnet_name]
  os_disk_storage_account_type        = var.vm_os_disk_storage_account_type
  boot_diagnostics_storage_account    = module.storage_account.primary_blob_endpoint
  log_analytics_workspace_id          = module.log_analytics_workspace.workspace_id
  log_analytics_workspace_key         = module.log_analytics_workspace.primary_shared_key
  log_analytics_workspace_resource_id = module.log_analytics_workspace.id
  script_storage_account_name         = module.storage_account.name
  script_storage_account_key          = module.storage_account.primary_access_key
  container_name                      = module.storage_account.scripts_container_name
  script_name                         = var.script_name
  azure_devops_url                    = azurerm_key_vault_secret.azure_devops_url.value
  azure_devops_pat                    = azurerm_key_vault_secret.azure_devops_pat.value
  azure_devops_agent_pool_name        = azurerm_key_vault_secret.azure_devops_agent_pool_name.value
  tags                                = local.tags
  network_security_group_id           = module.nsg.id
  custom_data                         = base64encode(file("./modules/virtual_machine/setup/cloud-init.yml"))
}


# ------------------------------------------------------------------------------------------------------
# Deploy container registry
# ------------------------------------------------------------------------------------------------------

module "container_registry" {
  source                     = "./modules/container_registry"
  name                       = "${var.project_prefix}${var.acr_name}"
  resource_group_name        = azurerm_resource_group.rg.name
  location                   = var.location
  sku                        = var.acr_sku
  admin_enabled              = var.acr_admin_enabled
  georeplication_locations   = var.acr_georeplication_locations
  log_analytics_workspace_id = module.log_analytics_workspace.id
  tags                       = local.tags
}

# ------------------------------------------------------------------------------------------------------
# Deploy log analytics workspace
# ------------------------------------------------------------------------------------------------------

module "log_analytics_workspace" {
  source              = "./modules/log_analytics_workspace"
  name                = "${var.project_prefix}-${var.log_analytics_workspace_name}"
  location            = var.location
  resource_group_name = azurerm_resource_group.rg.name
  solution_plan_map   = var.solution_plan_map
  tags                = local.tags
}

# ------------------------------------------------------------------------------------------------------
# Deploy virtual network
# ------------------------------------------------------------------------------------------------------


module "aks_network" {

  source                     = "./modules/virtual_network"
  resource_group_name        = azurerm_resource_group.rg.name
  location                   = var.location
  name                       = var.aks_vnet_name
  address_space              = var.aks_vnet_address_space
  log_analytics_workspace_id = module.log_analytics_workspace.id
  tags                       = local.tags

  subnets = [
    {
      name : var.default_node_pool_subnet_name
      address_prefixes : var.default_node_pool_subnet_address_prefix
      private_endpoint_network_policies_enabled : true
      private_link_service_network_policies_enabled : false
    },
    {
      name : var.additional_node_pool_subnet_name
      address_prefixes : var.additional_node_pool_subnet_address_prefix
      private_endpoint_network_policies_enabled : true
      private_link_service_network_policies_enabled : false
    },
    {
      name : var.pod_subnet_name
      address_prefixes : var.pod_subnet_address_prefix
      private_endpoint_network_policies_enabled : true
      private_link_service_network_policies_enabled : false
    },
    {
      name : var.vm_subnet_name
      address_prefixes : var.vm_subnet_address_prefix
      private_endpoint_network_policies_enabled : true
      private_link_service_network_policies_enabled : false
    }
  ]
}

module "hub_network" {
  source                     = "./modules/virtual_network"
  name                       = "${var.project_prefix}-${var.hub_vnet_name}"
  resource_group_name        = azurerm_resource_group.rg.name
  location                   = var.location
  address_space              = var.hub_address_space
  tags                       = local.tags
  log_analytics_workspace_id = module.log_analytics_workspace.id

  subnets = [
    {
      name : "AzureFirewallSubnet"
      address_prefixes : var.hub_firewall_subnet_address_prefix
      private_endpoint_network_policies_enabled : true
      private_link_service_network_policies_enabled : false
    },
    {
      name : "AzureBastionSubnet"
      address_prefixes : var.hub_bastion_subnet_address_prefix
      private_endpoint_network_policies_enabled : true
      private_link_service_network_policies_enabled : false
    }
  ]
}

# ------------------------------------------------------------------------------------------------------
# Deploy virtual network peering between hub and spoke
# ------------------------------------------------------------------------------------------------------

module "vnet_peering" {
  source              = "./modules/virtual_network_peering"
  vnet_1_name         = module.vnet_hub.name
  vnet_1_id           = module.vnet_hub.vnet_id
  vnet_1_rg           = azurerm_resource_group.rg.name
  vnet_2_name         = module.vnet_vm.name
  vnet_2_id           = module.vnet_vm.vnet_id
  vnet_2_rg           = azurerm_resource_group.rg.name
  peering_name_1_to_2 = "${module.vnet_hub.name}To${module.vnet_vm.name}"
  peering_name_2_to_1 = "${module.vnet_vm.name}To${module.vnet_hub.name}"

  depends_on = [module.hub_network, module.aks_network]
}

# ------------------------------------------------------------------------------------------------------
# Deploy bastion host
# ------------------------------------------------------------------------------------------------------

module "bastion_host" {
  source                     = "./modules/bastion_host"
  name                       = "${var.project_prefix}-${var.bastion_host_name}"
  location                   = var.location
  resource_group_name        = azurerm_resource_group.rg.name
  subnet_id                  = module.vnet_hub.subnet_ids[var.bastion_subnet_name]
  log_analytics_workspace_id = module.log_analytics_workspace.id
  tags                       = local.tags
}

# ------------------------------------------------------------------------------------------------------
# Deploy firewall
# ------------------------------------------------------------------------------------------------------

module "firewall" {
  source                     = "./modules/firewall"
  name                       = "${var.project_prefix}-${var.firewall_name}"
  resource_group_name        = azurerm_resource_group.rg.name
  zones                      = var.firewall_zones
  threat_intel_mode          = var.firewall_threat_intel_mode
  location                   = var.location
  sku_name                   = var.firewall_sku_name
  sku_tier                   = var.firewall_sku_tier
  pip_name                   = "${var.project_prefix}-${var.firewall_name}-pip"
  subnet_id                  = module.hub_network.subnet_ids["AzureFirewallSubnet"]
  log_analytics_workspace_id = module.log_analytics_workspace.id
  tags                       = local.tags
}

# ------------------------------------------------------------------------------------------------------
# Deploy route table
# ------------------------------------------------------------------------------------------------------

module "routetable" {
  source              = "./modules/route_table"
  resource_group_name = azurerm_resource_group.rg.name
  location            = var.location
  route_table_name    = local.route_table_name
  route_name          = local.route_name
  firewall_private_ip = module.firewall.private_ip_address
  subnets_to_associate = {
    (var.default_node_pool_subnet_name) = {
      subscription_id      = data.azurerm_client_config.current.subscription_id
      resource_group_name  = azurerm_resource_group.rg.name
      virtual_network_name = module.aks_network.name
    }
    (var.additional_node_pool_subnet_name) = {
      subscription_id      = data.azurerm_client_config.current.subscription_id
      resource_group_name  = azurerm_resource_group.rg.name
      virtual_network_name = module.aks_network.name
    }
    #  (var.pod_subnet_name) = { # Ensure pod subnet also routes through firewall
    #   subscription_id      = data.azurerm_client_config.current.subscription_id
    #   resource_group_name  = azurerm_resource_group.rg.name
    #   virtual_network_name = module.aks_network.name
    # }
  }
}

# ------------------------------------------------------------------------------------------------------
# Deploy aks
# ------------------------------------------------------------------------------------------------------

module "aks_cluster" {
  source                                   = "./modules/aks"
  name                                     = "${var.project_prefix}-${var.aks_cluster_name}"
  location                                 = var.location
  resource_group_name                      = azurerm_resource_group.rg.name
  resource_group_id                        = azurerm_resource_group.rg.id
  kubernetes_version                       = var.kubernetes_version
  dns_prefix                               = lower("${var.project_prefix}-${var.aks_cluster_name}")
  private_cluster_enabled                  = true
  automatic_channel_upgrade                = var.automatic_channel_upgrade
  sku_tier                                 = var.sku_tier
  default_node_pool_name                   = var.default_node_pool_name
  default_node_pool_vm_size                = var.default_node_pool_vm_size
  vnet_subnet_id                           = module.aks_network.subnet_ids[var.default_node_pool_subnet_name]
  default_node_pool_availability_zones     = var.default_node_pool_availability_zones
  default_node_pool_node_labels            = var.default_node_pool_node_labels
  default_node_pool_node_taints            = var.default_node_pool_node_taints
  default_node_pool_enable_auto_scaling    = var.default_node_pool_enable_auto_scaling
  default_node_pool_enable_host_encryption = var.default_node_pool_enable_host_encryption
  default_node_pool_enable_node_public_ip  = var.default_node_pool_enable_node_public_ip
  default_node_pool_max_pods               = var.default_node_pool_max_pods
  default_node_pool_max_count              = var.default_node_pool_max_count
  default_node_pool_min_count              = var.default_node_pool_min_count
  default_node_pool_node_count             = var.default_node_pool_node_count
  default_node_pool_os_disk_type           = var.default_node_pool_os_disk_type
  tags                                     = local.tags
  network_dns_service_ip                   = var.network_dns_service_ip
  network_plugin                           = var.network_plugin
  outbound_type                            = "userDefinedRouting"
  network_service_cidr                     = var.network_service_cidr
  log_analytics_workspace_id               = module.log_analytics_workspace.id
  role_based_access_control_enabled        = var.role_based_access_control_enabled
  tenant_id                                = data.azurerm_client_config.current.tenant_id
  admin_group_object_ids                   = var.admin_group_object_ids
  azure_rbac_enabled                       = var.azure_rbac_enabled
  admin_username                           = var.admin_username
  ssh_public_key                           = var.ssh_public_key
  keda_enabled                             = var.keda_enabled
  vertical_pod_autoscaler_enabled          = var.vertical_pod_autoscaler_enabled
  workload_identity_enabled                = var.workload_identity_enabled
  oidc_issuer_enabled                      = var.oidc_issuer_enabled
  open_service_mesh_enabled                = var.open_service_mesh_enabled
  image_cleaner_enabled                    = var.image_cleaner_enabled
  azure_policy_enabled                     = var.azure_policy_enabled
  http_application_routing_enabled         = var.http_application_routing_enabled

  depends_on = [module.routetable]
}

# ------------------------------------------------------------------------------------------------------
# Deploy private DNS zones
# ------------------------------------------------------------------------------------------------------

module "acr_private_dns_zone" {
  source              = "./modules/private_dns_zone"
  name                = "privatelink.azurecr.io"
  resource_group_name = azurerm_resource_group.rg.name
  tags                = local.tags
  virtual_networks_to_link = {
    (module.hub_network.name) = {
      subscription_id     = data.azurerm_client_config.current.subscription_id
      resource_group_name = azurerm_resource_group.rg.name
    }
    (module.aks_network.name) = {
      subscription_id     = data.azurerm_client_config.current.subscription_id
      resource_group_name = azurerm_resource_group.rg.name
    }
  }
}

module "key_vault_private_dns_zone" {
  source              = "./modules/private_dns_zone"
  name                = "privatelink.vaultcore.azure.net"
  resource_group_name = azurerm_resource_group.rg.name
  tags                = local.tags
  virtual_networks_to_link = {
    (module.hub_network.name) = {
      subscription_id     = data.azurerm_client_config.current.subscription_id
      resource_group_name = azurerm_resource_group.rg.name
    }
    (module.aks_network.name) = {
      subscription_id     = data.azurerm_client_config.current.subscription_id
      resource_group_name = azurerm_resource_group.rg.name
    }
  }
}

module "blob_private_dns_zone" {
  source              = "./modules/private_dns_zone"
  name                = "privatelink.blob.core.windows.net"
  resource_group_name = azurerm_resource_group.rg.name
  tags                = local.tags
  virtual_networks_to_link = {
    (module.hub_network.name) = {
      subscription_id     = data.azurerm_client_config.current.subscription_id
      resource_group_name = azurerm_resource_group.rg.name
    }
    (module.aks_network.name) = {
      subscription_id     = data.azurerm_client_config.current.subscription_id
      resource_group_name = azurerm_resource_group.rg.name
    }
  }
}


# ------------------------------------------------------------------------------------------------------
# Deploy private endpoints
# ------------------------------------------------------------------------------------------------------


module "acr_private_endpoint" {
  source                         = "./modules/private_endpoint"
  name                           = "${var.project_prefix}-acr-pe"
  location                       = var.location
  resource_group_name            = azurerm_resource_group.rg.name
  subnet_id                      = module.aks_network.subnet_ids[var.vm_subnet_name]
  tags                           = local.tags
  private_connection_resource_id = module.container_registry.id
  is_manual_connection           = false
  subresource_name               = "registry"
  private_dns_zone_group_name    = "AcrPrivateDnsZoneGroup"
  private_dns_zone_group_ids     = [module.acr_private_dns_zone.id]
}

module "key_vault_private_endpoint" {
  source                         = "./modules/private_endpoint"
  name                           = "${var.project_prefix}-kv-pe"
  location                       = var.location
  resource_group_name            = azurerm_resource_group.rg.name
  subnet_id                      = module.vnet_vm.subnet_ids[var.vm_subnet_name]
  tags                           = local.tags
  private_connection_resource_id = module.key_vault.id
  is_manual_connection           = false
  subresource_name               = "vault"
  private_dns_zone_group_name    = "KeyVaultPrivateDnsZoneGroup"
  private_dns_zone_group_ids     = [module.key_vault_private_dns_zone.id]
}

module "blob_private_endpoint" {
  source                         = "./modules/private_endpoint"
  name                           = "${var.project_prefix}-blob-pe"
  location                       = var.location
  resource_group_name            = azurerm_resource_group.rg.name
  subnet_id                      = module.vnet_vm.subnet_ids[var.vm_subnet_name]
  tags                           = local.tags
  private_connection_resource_id = module.storage_account.id
  is_manual_connection           = false
  subresource_name               = "blob"
  private_dns_zone_group_name    = "BlobPrivateDnsZoneGroup"
  private_dns_zone_group_ids     = [module.blob_private_dns_zone.id]
}

# ------------------------------------------------------------------------------------------------------
# Deploy key vault
# ------------------------------------------------------------------------------------------------------

resource "random_string" "key_valut_suffix" {
  length  = 6
  special = false
  lower   = true
  upper   = false
}

module "key_vault" {
  source                          = "./modules/key_vault"
  name                            = "${var.project_prefix}-${var.key_vault_name}-${random_string.key_vault_suffix}"
  location                        = var.location
  resource_group_name             = azurerm_resource_group.rg.name
  tenant_id                       = data.azurerm_client_config.current.tenant_id
  sku_name                        = var.key_vault_sku_name
  tags                            = local.tags
  enabled_for_deployment          = var.key_vault_enabled_for_deployment
  enabled_for_disk_encryption     = var.key_vault_enabled_for_disk_encryption
  enabled_for_template_deployment = var.key_vault_enabled_for_template_deployment
  enable_rbac_authorization       = var.key_vault_enable_rbac_authorization
  purge_protection_enabled        = var.key_vault_purge_protection_enabled
  soft_delete_retention_days      = var.key_vault_soft_delete_retention_days
  bypass                          = var.key_vault_bypass
  default_action                  = var.key_vault_default_action
  log_analytics_workspace_id      = module.log_analytics_workspace.id
}


resource "azurerm_role_assignment" "key_vault_admin" {
  scope                = module.key_vault.id
  role_definition_name = "Key Vault Administrator"
  principal_id         = data.azurerm_client_config.current.object_id
  principal_type       = "User" # Explicitly specify the principal type
  depends_on           = [module.key_vault]
}

resource "tls_private_key" "key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "azurerm_key_vault_secret" "terraform_backend_storage_account_name" {
  name         = "STORAGE-ACCOUNT-NAME"
  value        = module.storage_account.name
  key_vault_id = module.key_vault.id
  depends_on   = [azurerm_role_assignment.key_vault_admin]
}

resource "azurerm_key_vault_secret" "terraform_backend_storage_account_key" {
  name         = "STORAGE-ACCOUNT-KEY"
  value        = module.storage_account.primary_access_key
  key_vault_id = module.key_vault.id
  depends_on   = [azurerm_role_assignment.key_vault_admin]
}

resource "azurerm_key_vault_secret" "scripts_container_name" {
  name         = "SCRIPTS-CONTAINER-NAME"
  value        = module.storage_account.scripts_container_name
  key_vault_id = module.key_vault.id
  depends_on   = [azurerm_role_assignment.key_vault_admin]
}

resource "azurerm_key_vault_secret" "ssh_public_key" {
  name         = "SSH-PUBLIC-KEY"
  value        = tls_private_key.key.public_key_openssh
  key_vault_id = module.key_vault.id
  depends_on   = [azurerm_role_assignment.key_vault_admin]
}

resource "azurerm_key_vault_secret" "ssh_private_key" {
  name         = "SSH-PRIVATE-KEY"
  value        = tls_private_key.key.private_key_pem
  key_vault_id = module.key_vault.id
  depends_on   = [azurerm_role_assignment.key_vault_admin]
}

resource "azurerm_key_vault_secret" "azure_devops_url" {
  name         = "AZURE-DEVOPS-URL"
  value        = var.azure_devops_url
  key_vault_id = module.key_vault.id
  depends_on   = [azurerm_role_assignment.key_vault_admin]
}

resource "azurerm_key_vault_secret" "azure_devops_pat" {
  name         = "SECRET-AZURE-DEVOPS-PAT"
  value        = var.azure_devops_pat
  key_vault_id = module.key_vault.id
  depends_on   = [azurerm_role_assignment.key_vault_admin]
}

resource "azurerm_key_vault_secret" "azure_devops_agent_pool_name" {
  name         = "AZURE-DEVOPS-AGENT-POOL-NAME"
  value        = var.azure_devops_agent_pool_name
  key_vault_id = module.key_vault.id
  depends_on   = [azurerm_role_assignment.key_vault_admin]
}

# -----------------------------------------------------------------------------
# Deploys a specified Helm chart to the created AKS cluster.
# -----------------------------------------------------------------------------

module "helm_deployment" {
  source = "./modules/helm_deployment"

  kube_config_raw = module.aks_cluster.kube_config_raw

  chart_name       = var.helm_chart_name
  chart_version    = var.helm_chart_version
  release_name     = var.helm_release_name
  namespace        = var.helm_namespace
  create_namespace = var.helm_create_namespace
  values_file_path = var.helm_values_file_path
  set_values       = var.helm_set_values
}

# -----------------------------------------------------------------------------
# Azure Workload Identity Federation Configuration
# This module sets up an Azure AD application, service principal,
# federated credential, and assigns a role for a specific workload.
# -----------------------------------------------------------------------------

module "workload_identity_federation_acr_pull" {
  source = "./modules/workload_identity_federation"

  application_display_name = "${var.project_prefix}-acr-pull-app"
  resource_group_name = azurerm_resource_group.rg.name

  aks_oidc_issuer_url        = module.aks_cluster.oidc_issuer_url # Output from AKS module
  kubernetes_namespace       = var.workload_identity_namespace
  kubernetes_service_account = var.workload_identity_service_account

  scope                = module.container_registry.id # Target resource (ACR)
  role_definition_name = "AcrPull"                    # Least privilege role for pulling images
  principal_type       = "ServicePrincipal"

  depends_on = [module.aks_cluster, module.container_registry]
}
