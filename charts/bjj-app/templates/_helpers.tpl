{{- define "bjj-app.name" -}}
{{- $chartName := "" -}}
{{- if .Chart -}}
{{- $chartName = default "" .Chart.Name -}}
{{- end -}}
{{- $nameOverrideValue := "" -}}
{{- if (and .Values (hasKey .Values "nameOverride")) -}}
{{- $nameOverrideValue = default "" .Values.nameOverride -}}
{{- end -}}
{{- default $chartName $nameOverrideValue | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "bjj-app.fullname" -}}
{{- if (and .Values (hasKey .Values "fullnameOverride")) -}}
{{- default "" .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $chartName := "" -}}
{{- if .Chart -}}
{{- $chartName = default "" .Chart.Name -}}
{{- end -}}
{{- $nameOverrideValue := "" -}}
{{- if (and .Values (hasKey .Values "nameOverride")) -}}
{{- $nameOverrideValue = default "" .Values.nameOverride -}}
{{- end -}}
{{- $releaseName := "" -}}
{{- if .Release -}}
{{- $releaseName = default "" .Release.Name -}}
{{- end -}}
{{- $name := default $chartName $nameOverrideValue -}}
{{- if contains $name $releaseName -}}
{{- $releaseName | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" $releaseName $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{- define "bjj-app.api.fullname" -}}
{{- printf "%s-api" (include "bjj-app.fullname" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "bjj-app.frontend.fullname" -}}
{{- printf "%s-frontend" (include "bjj-app.fullname" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "bjj-app.mongodb.fullname" -}}
{{- printf "%s-mongodb" (include "bjj-app.fullname" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "bjj-app.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "bjj-app.labels" -}}
helm.sh/chart: {{ include "bjj-app.chart" . }}
{{ include "bjj-app.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{- define "bjj-app.selectorLabels" -}}
app.kubernetes.io/name: {{ include "bjj-app.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}
