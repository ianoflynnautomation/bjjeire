subscription_id              = "58d40cf2-ef54-4b19-b24d-41576509400c"
location                     = "switzerlandnorth"
resource_group_name          = "rg"


resource_group_name          = "rg"
azure_devops_url             = "https://dev.azure.com/ianoflynnlimited"
azure_devops_pat             = "7FX1pIosq2suXlnnz2A5iA7MZM0xlGS9WeDfFP2IiYHzAuovuvOhJQQJ99BCACAAAAAAAAAAAAASAZDO41Cy"
azure_devops_agent_pool_name = "shared-infra-test-pool"
script_storage_account_name  = "sascriptsvm01"
script_storage_account_key   = "H8+wSbjuIQ0G1CW1caws9glqK8eaMJJAQ9uhS16uWTPkogeP1jqysQ7hmtnfCYKcHDSO6FKlh5oG+AStFgNUCg=="
container_name               = "scripts"
personal_access_token        = "7FX1pIosq2suXlnnz2A5iA7MZM0xlGS9WeDfFP2IiYHzAuovuvOhJQQJ99BCACAAAAAAAAAAAAASAZDO41Cy"
org_service_url              = "https://dev.azure.com/ianoflynnlimited"

helm_chart_name       = "bjj-app"
helm_chart_version    = "0.1.0"
helm_release_name     = "bjj-app-release"
helm_namespace        = "bjj-app"
helm_create_namespace = true
helm_values_file_path = "../../charts/bjj-app/values-aks.yaml"
helm_set_values       = [] 