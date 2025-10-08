# 1. Configure the Azure Provider
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

# 2. Authenticate to Azure
provider "azurerm" {
  features {}
}

# 3. Define the Resource Group
resource "azurerm_resource_group" "rg" {
  name     = "fee-portal-rg"
  location = "South Central US"
}