terraform {
  required_providers {
    k3d = {
      source  = "pvotal-tech/k3d"
      version = "~> 0.0.6"
    }
  }
}

provider "k3d" {}

resource "k3d_cluster" "enquete" {
  name    = "enquete"
  servers = 1
  agents  = 2

  port {
    host_port      = 5000
    container_port = 30000
    node_filters   = ["loadbalancer"]
  }

  port {
    host_port      = 3000
    container_port = 30001
    node_filters   = ["loadbalancer"]
  }

  image   = "docker.io/rancher/k3s:v1.27.4-k3s1"
  network = "enquete-net"
}