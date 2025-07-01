

resource "kubernetes_namespace" "main" {
  count = var.create_namespace ? 1 : 0
  metadata {
    name = var.namespace
  }
}

resource "helm_release" "main" {
  name      = var.release_name
  chart     = var.chart_name
  version   = var.chart_version
  namespace = var.namespace
  wait      = true
  timeout   = 600

  dynamic "set" {
    for_each = var.set_values
    content {
      name  = split("=", set.value)[0]
      value = split("=", set.value)[1]
    }
  }


  values = var.values_file_path != "" ? [file(var.values_file_path)] : []

  depends_on = [
    kubernetes_namespace.main
  ]
}
