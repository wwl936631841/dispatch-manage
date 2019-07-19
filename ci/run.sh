#!/usr/bin/env bash
kubectl get deploy -n <NAMESPACE> {DEPLOYMENT}
if [ $? -eq 0 ]; then
    kubectl set image deployments/<DEPLOYMENT> {DEPLOYMENT}=<IMG_REPO>/<IMG_REPO_NAME>/<ENV_NAME>:<BUILD_TAG> --namespace=<NAMESPACE>
else
    kubectl create -f <FILE>
fi