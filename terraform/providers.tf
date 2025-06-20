terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "4.20.0"
    }
    azapi = {
      source  = "Azure/azapi"
      version = "2.2.0"
    }
  }
}

provider "azurerm" {
  subscription_id = var.subscription_id
  features {}
}


provider "azapi" {
}