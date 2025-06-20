data "azurerm_client_config" "current" {}

locals {
  tags                   = { code = "terraform" }
  storage_account_prefix = "boot"
}

# ------------------------------------------------------------------------------------------------------
# Deploy container registry
# ------------------------------------------------------------------------------------------------------

