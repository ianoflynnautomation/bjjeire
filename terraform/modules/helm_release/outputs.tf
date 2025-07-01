output "release_status" {
  description = "The status of the deployed Helm release."
  value       = helm_release.main.status
}
