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
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.0"
    }
  }
}

provider "azurerm" {
  subscription_id = var.subscription_id
  features {}
}

provider "azapi" {}

# Configure the Helm provider to use the AKS cluster's kubeconfig
provider "helm" {
  kubernetes {
    host                   = module.aks_cluster.kube_config[0].host
    client_certificate     = base64decode(module.aks_cluster.kube_config[0].client_certificate)
    client_key             = base64decode(module.aks_cluster.kube_config[0].client_key)
    cluster_ca_certificate = base64decode(module.aks_cluster.kube_config[0].cluster_ca_certificate)
  }
}

# Configure the Kubernetes provider to use the AKS cluster's kubeconfig
provider "kubernetes" {
  host                   = module.aks_cluster.kube_config[0].host
  client_certificate     = base64decode(module.aks_cluster.kube_config[0].client_certificate)
  client_key             = base64decode(module.aks_cluster.kube_config[0].client_key)
  cluster_ca_certificate = base64decode(module.aks_cluster.kube_config[0].cluster_ca_certificate)
}


