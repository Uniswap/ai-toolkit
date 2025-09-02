---
description: Set up comprehensive monitoring for applications with automated metrics identification, alerting, and dashboard configuration
argument-hint: monitor [application-type] [monitoring-platform] [options]
allowed-tools: Bash(*), Read(*), Write(*.yml), Write(*.json), Write(*.md), Edit(*), Grep(*), Glob(*), LS(*)
---

# Monitor Command

## Overview

The monitor command provides automated monitoring setup for applications, including metrics identification, alert configuration, and dashboard creation across multiple monitoring platforms.

## Inputs

Parse command arguments to determine monitoring configuration:

```yaml
application_type:
  - microservices
  - monolith
  - serverless
  - spa (single page application)
  - mobile-api
  - data-pipeline
  - auto-detect

monitoring_platform:
  - prometheus-grafana
  - datadog
  - newrelic
  - cloudwatch
  - azure-insights
  - elastic-apm
  - auto-select

options:
  environment: [development, staging, production]
  severity_levels: [critical, warning, info]
  notification_channels: [email, slack, pagerduty, webhook]
  retention_period: [7d, 30d, 90d, 365d]
  sampling_rate: [0.1, 1, 5, 10] # percentage
  custom_metrics: [true, false]
  business_metrics: [true, false]
  sli_slo_setup: [true, false]
```

## Task

### 1. Application Analysis

Analyze the codebase to identify monitoring requirements:

#### Code Pattern Analysis

- **Framework Detection**: Identify web frameworks (Express, FastAPI, Spring Boot, etc.)
- **Database Usage**: Detect database connections and query patterns
- **External Dependencies**: Find API calls, message queues, cache usage
- **Error Handling**: Locate error handling patterns and logging statements
- **Performance Bottlenecks**: Identify potentially slow operations

#### Architecture Assessment

- **Service Boundaries**: Map service interactions for microservices
- **Data Flow**: Trace request/response patterns
- **Resource Usage**: Identify CPU/memory intensive operations
- **Scalability Points**: Find auto-scaling triggers and limits

### 2. Metrics Identification

#### Application Metrics

```yaml
response_time_metrics:
  - http_request_duration_seconds
  - database_query_duration_seconds
  - external_api_call_duration_seconds
  - business_process_duration_seconds

throughput_metrics:
  - http_requests_per_second
  - transactions_per_second
  - messages_processed_per_second
  - concurrent_users

error_metrics:
  - http_error_rate_4xx
  - http_error_rate_5xx
  - database_connection_errors
  - external_service_errors
  - application_exceptions

availability_metrics:
  - service_uptime_percentage
  - health_check_success_rate
  - dependency_availability
```

#### Infrastructure Metrics

```yaml
system_metrics:
  - cpu_usage_percentage
  - memory_usage_percentage
  - disk_usage_percentage
  - network_io_bytes
  - file_descriptor_usage

container_metrics:
  - container_cpu_usage
  - container_memory_usage
  - container_restart_count
  - pod_status (kubernetes)

database_metrics:
  - connection_pool_usage
  - query_performance
  - deadlock_count
  - replication_lag
```

#### Business Metrics

```yaml
user_metrics:
  - active_users_count
  - user_session_duration
  - user_retention_rate
  - feature_usage_count

transaction_metrics:
  - revenue_per_minute
  - conversion_rate
  - cart_abandonment_rate
  - payment_success_rate

content_metrics:
  - page_views
  - bounce_rate
  - search_queries
  - download_count
```

### 3. Alert Configuration

#### Threshold-Based Alerts

```yaml
critical_alerts:
  - name: 'High Error Rate'
    condition: 'error_rate > 5%'
    duration: '2m'
    severity: 'critical'
    channels: ['pagerduty', 'slack']

  - name: 'Service Down'
    condition: 'up == 0'
    duration: '30s'
    severity: 'critical'
    channels: ['pagerduty', 'email']

  - name: 'High Response Time'
    condition: 'response_time_p95 > 2s'
    duration: '5m'
    severity: 'critical'
    channels: ['slack', 'email']

warning_alerts:
  - name: 'High CPU Usage'
    condition: 'cpu_usage > 80%'
    duration: '5m'
    severity: 'warning'
    channels: ['slack']

  - name: 'High Memory Usage'
    condition: 'memory_usage > 85%'
    duration: '3m'
    severity: 'warning'
    channels: ['slack']

  - name: 'Increased Response Time'
    condition: 'response_time_p95 > 1s'
    duration: '10m'
    severity: 'warning'
    channels: ['email']
```

#### Anomaly Detection Alerts

```yaml
anomaly_alerts:
  - name: 'Unusual Traffic Pattern'
    metric: 'requests_per_second'
    algorithm: 'statistical_deviation'
    sensitivity: 'medium'
    learning_period: '7d'

  - name: 'Memory Leak Detection'
    metric: 'memory_usage'
    algorithm: 'trend_analysis'
    sensitivity: 'high'
    learning_period: '24h'

  - name: 'Response Time Anomaly'
    metric: 'response_time_p95'
    algorithm: 'seasonal_decomposition'
    sensitivity: 'medium'
    learning_period: '14d'
```

### 4. Dashboard Configuration

#### Service Health Dashboard

```yaml
service_health_dashboard:
  panels:
    - title: 'Service Status Overview'
      type: 'stat'
      metrics: ['up', 'health_check_status']

    - title: 'Request Rate'
      type: 'graph'
      metrics: ['http_requests_per_second']
      time_range: '1h'

    - title: 'Response Time Distribution'
      type: 'histogram'
      metrics: ['http_request_duration_seconds']

    - title: 'Error Rate'
      type: 'graph'
      metrics: ['http_error_rate_4xx', 'http_error_rate_5xx']

    - title: 'Top Errors'
      type: 'table'
      metrics: ['error_messages', 'error_count']
      limit: 10
```

#### Performance Dashboard

```yaml
performance_dashboard:
  panels:
    - title: 'Response Time Percentiles'
      type: 'graph'
      metrics: ['response_time_p50', 'response_time_p95', 'response_time_p99']

    - title: 'Throughput'
      type: 'graph'
      metrics: ['requests_per_second', 'transactions_per_second']

    - title: 'Resource Utilization'
      type: 'graph'
      metrics: ['cpu_usage', 'memory_usage', 'disk_usage']

    - title: 'Database Performance'
      type: 'graph'
      metrics: ['db_query_duration', 'db_connections_active']

    - title: 'Cache Hit Rate'
      type: 'stat'
      metrics: ['cache_hit_rate']
```

#### Business KPI Dashboard

```yaml
business_kpi_dashboard:
  panels:
    - title: 'Active Users'
      type: 'stat'
      metrics: ['active_users_current', 'active_users_24h']

    - title: 'Revenue Metrics'
      type: 'graph'
      metrics: ['revenue_per_hour', 'conversion_rate']

    - title: 'User Journey Funnel'
      type: 'funnel'
      metrics: ['page_visits', 'signups', 'conversions']

    - title: 'Feature Usage'
      type: 'heatmap'
      metrics: ['feature_usage_by_user', 'feature_adoption_rate']
```

### 5. Platform-Specific Implementation

#### Prometheus/Grafana Setup

```yaml
prometheus_config:
  scrape_configs:
    - job_name: 'application'
      static_configs:
        - targets: ['localhost:8080']
      metrics_path: '/metrics'
      scrape_interval: '30s'

  alerting:
    alertmanagers:
      - static_configs:
          - targets: ['alertmanager:9093']

  rule_files:
    - 'alert_rules.yml'
    - 'recording_rules.yml'

grafana_dashboards:
  - service_health.json
  - performance_metrics.json
  - business_kpis.json
  - infrastructure.json
```

#### DataDog Configuration

```yaml
datadog_config:
  api_key: '${DATADOG_API_KEY}'
  app_key: '${DATADOG_APP_KEY}'

  dashboards:
    - title: 'Application Overview'
      widgets:
        - title: 'Request Rate'
          definition:
            type: 'timeseries'
            requests:
              - q: 'sum:http.requests{*}.as_rate()'

  monitors:
    - name: 'High Error Rate'
      type: 'metric alert'
      query: 'avg(last_5m):avg:http.errors{*}.as_rate() > 0.05'
      message: 'Error rate is above 5%'
      tags: ['team:backend', 'severity:critical']
```

#### New Relic Configuration

```yaml
newrelic_config:
  license_key: '${NEW_RELIC_LICENSE_KEY}'
  app_name: 'MyApplication'

  custom_insights:
    - event_type: 'BusinessMetrics'
      attributes:
        - user_id
        - transaction_amount
        - feature_used

  alerts:
    - name: 'Apdex Score'
      type: 'apdex'
      condition: 'below'
      threshold: 0.8
      duration: 300
```

### 6. SLI/SLO Definition

#### Service Level Indicators

```yaml
slis:
  availability:
    description: 'Percentage of successful requests'
    calculation: "sum(http_requests{status!~'5..'})/sum(http_requests)"

  latency:
    description: '95th percentile response time'
    calculation: 'histogram_quantile(0.95, http_request_duration_seconds)'

  error_rate:
    description: 'Percentage of failed requests'
    calculation: "sum(http_requests{status=~'5..'})/sum(http_requests)"
```

#### Service Level Objectives

```yaml
slos:
  availability_slo:
    target: 99.9%
    time_window: '30d'
    error_budget: 0.1%

  latency_slo:
    target: '< 200ms'
    percentile: 95
    time_window: '30d'

  error_rate_slo:
    target: '< 1%'
    time_window: '30d'
```

## Delegation

### Agent Coordination

1. **Infrastructure Agent**: Configure system-level monitoring (CPU, memory, disk, network)
2. **Application Agent**: Set up application-specific metrics and traces
3. **Database Agent**: Configure database monitoring and performance metrics
4. **Security Agent**: Implement security monitoring and compliance checks
5. **DevOps Agent**: Configure CI/CD pipeline monitoring and deployment tracking

### Workflow Orchestration

```yaml
monitoring_setup_workflow:
  phases:
    - name: 'discovery'
      agent: 'application_agent'
      tasks: ['analyze_codebase', 'identify_frameworks', 'map_dependencies']

    - name: 'metrics_design'
      agent: 'infrastructure_agent'
      tasks: ['define_slis', 'create_dashboards', 'setup_alerts']
      dependencies: ['discovery']

    - name: 'implementation'
      agent: 'devops_agent'
      tasks: ['deploy_monitoring', 'configure_agents', 'test_alerts']
      dependencies: ['metrics_design']

    - name: 'validation'
      agent: 'application_agent'
      tasks: ['verify_metrics', 'test_dashboards', 'validate_alerts']
      dependencies: ['implementation']
```

## Output

### Monitoring Configuration Report

```yaml
monitoring_report:
  summary:
    application_type: 'microservices'
    monitoring_platform: 'prometheus-grafana'
    metrics_configured: 45
    alerts_configured: 12
    dashboards_created: 4

  metrics_inventory:
    application_metrics: 20
    infrastructure_metrics: 15
    business_metrics: 10

  alert_coverage:
    critical_alerts: 6
    warning_alerts: 4
    info_alerts: 2

  dashboard_summary:
    - name: 'Service Health'
      panels: 8
      refresh_rate: '30s'

    - name: 'Performance Metrics'
      panels: 12
      refresh_rate: '1m'

  sli_slo_definition:
    availability_slo: '99.9%'
    latency_slo: '< 200ms (p95)'
    error_rate_slo: '< 1%'

  files_created:
    - config/prometheus.yml
    - config/alert_rules.yml
    - dashboards/service_health.json
    - dashboards/performance.json
    - docker-compose.monitoring.yml

  next_steps:
    - 'Deploy monitoring stack'
    - 'Configure notification channels'
    - 'Set up log aggregation'
    - 'Create runbooks for alerts'
    - 'Schedule SLO reviews'
```

### Implementation Examples

#### Microservices Monitoring

```bash
# Example: Set up comprehensive monitoring for microservices
monitor microservices prometheus-grafana \
  --environment=production \
  --severity-levels=critical,warning \
  --notification-channels=slack,pagerduty \
  --sli-slo-setup=true \
  --business-metrics=true
```

#### Monolith Application Monitoring

```bash
# Example: Monitor a monolithic application with DataDog
monitor monolith datadog \
  --environment=staging \
  --custom-metrics=true \
  --retention-period=90d \
  --sampling-rate=5
```

#### Serverless Function Monitoring

```bash
# Example: Set up monitoring for serverless functions
monitor serverless cloudwatch \
  --environment=production \
  --notification-channels=email,webhook \
  --business-metrics=false
```

### Troubleshooting Guide

#### Common Issues and Solutions

1. **Metrics Not Appearing**

   - Check metric endpoint accessibility
   - Verify scrape configuration
   - Confirm metric naming conventions
   - Validate service discovery

2. **High Cardinality Issues**

   - Implement metric filtering
   - Use recording rules for aggregation
   - Limit label values
   - Set retention policies

3. **Alert Fatigue**

   - Tune alert thresholds
   - Implement alert grouping
   - Add alert dependencies
   - Create escalation policies

4. **Dashboard Performance**
   - Optimize query performance
   - Use appropriate time ranges
   - Implement result caching
   - Reduce panel refresh rates

### Best Practices

1. **Metric Design**

   - Use consistent naming conventions
   - Implement proper labeling strategy
   - Avoid high cardinality metrics
   - Document metric meanings

2. **Alert Management**

   - Start with conservative thresholds
   - Implement alert dependencies
   - Use appropriate notification channels
   - Create clear runbooks

3. **Dashboard Organization**

   - Group related metrics
   - Use consistent color schemes
   - Implement role-based access
   - Regular dashboard reviews

4. **Performance Optimization**
   - Monitor monitoring system itself
   - Implement proper retention policies
   - Use efficient query patterns
   - Regular cleanup and maintenance
