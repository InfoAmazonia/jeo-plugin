<?php
// This file was auto-generated from sdk-root/src/data/opsworkscm/2016-11-01/endpoint-tests-1.json
return [ 'testCases' => [ [ 'documentation' => 'For region eu-central-1 with FIPS enabled and DualStack enabled', 'expect' => [ 'endpoint' => [ 'url' => 'https://opsworks-cm-fips.eu-central-1.api.aws', ], ], 'params' => [ 'Region' => 'eu-central-1', 'UseDualStack' => true, 'UseFIPS' => true, ], ], [ 'documentation' => 'For region eu-central-1 with FIPS enabled and DualStack disabled', 'expect' => [ 'endpoint' => [ 'url' => 'https://opsworks-cm-fips.eu-central-1.amazonaws.com', ], ], 'params' => [ 'Region' => 'eu-central-1', 'UseDualStack' => false, 'UseFIPS' => true, ], ], [ 'documentation' => 'For region eu-central-1 with FIPS disabled and DualStack enabled', 'expect' => [ 'endpoint' => [ 'url' => 'https://opsworks-cm.eu-central-1.api.aws', ], ], 'params' => [ 'Region' => 'eu-central-1', 'UseDualStack' => true, 'UseFIPS' => false, ], ], [ 'documentation' => 'For region eu-central-1 with FIPS disabled and DualStack disabled', 'expect' => [ 'endpoint' => [ 'url' => 'https://opsworks-cm.eu-central-1.amazonaws.com', ], ], 'params' => [ 'Region' => 'eu-central-1', 'UseDualStack' => false, 'UseFIPS' => false, ], ], [ 'documentation' => 'For region us-west-1 with FIPS enabled and DualStack enabled', 'expect' => [ 'endpoint' => [ 'url' => 'https://opsworks-cm-fips.us-west-1.api.aws', ], ], 'params' => [ 'Region' => 'us-west-1', 'UseDualStack' => true, 'UseFIPS' => true, ], ], [ 'documentation' => 'For region us-west-1 with FIPS enabled and DualStack disabled', 'expect' => [ 'endpoint' => [ 'url' => 'https://opsworks-cm-fips.us-west-1.amazonaws.com', ], ], 'params' => [ 'Region' => 'us-west-1', 'UseDualStack' => false, 'UseFIPS' => true, ], ], [ 'documentation' => 'For region us-west-1 with FIPS disabled and DualStack enabled', 'expect' => [ 'endpoint' => [ 'url' => 'https://opsworks-cm.us-west-1.api.aws', ], ], 'params' => [ 'Region' => 'us-west-1', 'UseDualStack' => true, 'UseFIPS' => false, ], ], [ 'documentation' => 'For region us-west-1 with FIPS disabled and DualStack disabled', 'expect' => [ 'endpoint' => [ 'url' => 'https://opsworks-cm.us-west-1.amazonaws.com', ], ], 'params' => [ 'Region' => 'us-west-1', 'UseDualStack' => false, 'UseFIPS' => false, ], ], [ 'documentation' => 'For region us-west-2 with FIPS enabled and DualStack enabled', 'expect' => [ 'endpoint' => [ 'url' => 'https://opsworks-cm-fips.us-west-2.api.aws', ], ], 'params' => [ 'Region' => 'us-west-2', 'UseDualStack' => true, 'UseFIPS' => true, ], ], [ 'documentation' => 'For region us-west-2 with FIPS enabled and DualStack disabled', 'expect' => [ 'endpoint' => [ 'url' => 'https://opsworks-cm-fips.us-west-2.amazonaws.com', ], ], 'params' => [ 'Region' => 'us-west-2', 'UseDualStack' => false, 'UseFIPS' => true, ], ], [ 'documentation' => 'For region us-west-2 with FIPS disabled and DualStack enabled', 'expect' => [ 'endpoint' => [ 'url' => 'https://opsworks-cm.us-west-2.api.aws', ], ], 'params' => [ 'Region' => 'us-west-2', 'UseDualStack' => true, 'UseFIPS' => false, ], ], [ 'documentation' => 'For region us-west-2 with FIPS disabled and DualStack disabled', 'expect' => [ 'endpoint' => [ 'url' => 'https://opsworks-cm.us-west-2.amazonaws.com', ], ], 'params' => [ 'Region' => 'us-west-2', 'UseDualStack' => false, 'UseFIPS' => false, ], ], [ 'documentation' => 'For region eu-west-1 with FIPS enabled and DualStack enabled', 'expect' => [ 'endpoint' => [ 'url' => 'https://opsworks-cm-fips.eu-west-1.api.aws', ], ], 'params' => [ 'Region' => 'eu-west-1', 'UseDualStack' => true, 'UseFIPS' => true, ], ], [ 'documentation' => 'For region eu-west-1 with FIPS enabled and DualStack disabled', 'expect' => [ 'endpoint' => [ 'url' => 'https://opsworks-cm-fips.eu-west-1.amazonaws.com', ], ], 'params' => [ 'Region' => 'eu-west-1', 'UseDualStack' => false, 'UseFIPS' => true, ], ], [ 'documentation' => 'For region eu-west-1 with FIPS disabled and DualStack enabled', 'expect' => [ 'endpoint' => [ 'url' => 'https://opsworks-cm.eu-west-1.api.aws', ], ], 'params' => [ 'Region' => 'eu-west-1', 'UseDualStack' => true, 'UseFIPS' => false, ], ], [ 'documentation' => 'For region eu-west-1 with FIPS disabled and DualStack disabled', 'expect' => [ 'endpoint' => [ 'url' => 'https://opsworks-cm.eu-west-1.amazonaws.com', ], ], 'params' => [ 'Region' => 'eu-west-1', 'UseDualStack' => false, 'UseFIPS' => false, ], ], [ 'documentation' => 'For region ap-northeast-1 with FIPS enabled and DualStack enabled', 'expect' => [ 'endpoint' => [ 'url' => 'https://opsworks-cm-fips.ap-northeast-1.api.aws', ], ], 'params' => [ 'Region' => 'ap-northeast-1', 'UseDualStack' => true, 'UseFIPS' => true, ], ], [ 'documentation' => 'For region ap-northeast-1 with FIPS enabled and DualStack disabled', 'expect' => [ 'endpoint' => [ 'url' => 'https://opsworks-cm-fips.ap-northeast-1.amazonaws.com', ], ], 'params' => [ 'Region' => 'ap-northeast-1', 'UseDualStack' => false, 'UseFIPS' => true, ], ], [ 'documentation' => 'For region ap-northeast-1 with FIPS disabled and DualStack enabled', 'expect' => [ 'endpoint' => [ 'url' => 'https://opsworks-cm.ap-northeast-1.api.aws', ], ], 'params' => [ 'Region' => 'ap-northeast-1', 'UseDualStack' => true, 'UseFIPS' => false, ], ], [ 'documentation' => 'For region ap-northeast-1 with FIPS disabled and DualStack disabled', 'expect' => [ 'endpoint' => [ 'url' => 'https://opsworks-cm.ap-northeast-1.amazonaws.com', ], ], 'params' => [ 'Region' => 'ap-northeast-1', 'UseDualStack' => false, 'UseFIPS' => false, ], ], [ 'documentation' => 'For region ap-southeast-1 with FIPS enabled and DualStack enabled', 'expect' => [ 'endpoint' => [ 'url' => 'https://opsworks-cm-fips.ap-southeast-1.api.aws', ], ], 'params' => [ 'Region' => 'ap-southeast-1', 'UseDualStack' => true, 'UseFIPS' => true, ], ], [ 'documentation' => 'For region ap-southeast-1 with FIPS enabled and DualStack disabled', 'expect' => [ 'endpoint' => [ 'url' => 'https://opsworks-cm-fips.ap-southeast-1.amazonaws.com', ], ], 'params' => [ 'Region' => 'ap-southeast-1', 'UseDualStack' => false, 'UseFIPS' => true, ], ], [ 'documentation' => 'For region ap-southeast-1 with FIPS disabled and DualStack enabled', 'expect' => [ 'endpoint' => [ 'url' => 'https://opsworks-cm.ap-southeast-1.api.aws', ], ], 'params' => [ 'Region' => 'ap-southeast-1', 'UseDualStack' => true, 'UseFIPS' => false, ], ], [ 'documentation' => 'For region ap-southeast-1 with FIPS disabled and DualStack disabled', 'expect' => [ 'endpoint' => [ 'url' => 'https://opsworks-cm.ap-southeast-1.amazonaws.com', ], ], 'params' => [ 'Region' => 'ap-southeast-1', 'UseDualStack' => false, 'UseFIPS' => false, ], ], [ 'documentation' => 'For region ap-southeast-2 with FIPS enabled and DualStack enabled', 'expect' => [ 'endpoint' => [ 'url' => 'https://opsworks-cm-fips.ap-southeast-2.api.aws', ], ], 'params' => [ 'Region' => 'ap-southeast-2', 'UseDualStack' => true, 'UseFIPS' => true, ], ], [ 'documentation' => 'For region ap-southeast-2 with FIPS enabled and DualStack disabled', 'expect' => [ 'endpoint' => [ 'url' => 'https://opsworks-cm-fips.ap-southeast-2.amazonaws.com', ], ], 'params' => [ 'Region' => 'ap-southeast-2', 'UseDualStack' => false, 'UseFIPS' => true, ], ], [ 'documentation' => 'For region ap-southeast-2 with FIPS disabled and DualStack enabled', 'expect' => [ 'endpoint' => [ 'url' => 'https://opsworks-cm.ap-southeast-2.api.aws', ], ], 'params' => [ 'Region' => 'ap-southeast-2', 'UseDualStack' => true, 'UseFIPS' => false, ], ], [ 'documentation' => 'For region ap-southeast-2 with FIPS disabled and DualStack disabled', 'expect' => [ 'endpoint' => [ 'url' => 'https://opsworks-cm.ap-southeast-2.amazonaws.com', ], ], 'params' => [ 'Region' => 'ap-southeast-2', 'UseDualStack' => false, 'UseFIPS' => false, ], ], [ 'documentation' => 'For region us-east-1 with FIPS enabled and DualStack enabled', 'expect' => [ 'endpoint' => [ 'url' => 'https://opsworks-cm-fips.us-east-1.api.aws', ], ], 'params' => [ 'Region' => 'us-east-1', 'UseDualStack' => true, 'UseFIPS' => true, ], ], [ 'documentation' => 'For region us-east-1 with FIPS enabled and DualStack disabled', 'expect' => [ 'endpoint' => [ 'url' => 'https://opsworks-cm-fips.us-east-1.amazonaws.com', ], ], 'params' => [ 'Region' => 'us-east-1', 'UseDualStack' => false, 'UseFIPS' => true, ], ], [ 'documentation' => 'For region us-east-1 with FIPS disabled and DualStack enabled', 'expect' => [ 'endpoint' => [ 'url' => 'https://opsworks-cm.us-east-1.api.aws', ], ], 'params' => [ 'Region' => 'us-east-1', 'UseDualStack' => true, 'UseFIPS' => false, ], ], [ 'documentation' => 'For region us-east-1 with FIPS disabled and DualStack disabled', 'expect' => [ 'endpoint' => [ 'url' => 'https://opsworks-cm.us-east-1.amazonaws.com', ], ], 'params' => [ 'Region' => 'us-east-1', 'UseDualStack' => false, 'UseFIPS' => false, ], ], [ 'documentation' => 'For region us-east-2 with FIPS enabled and DualStack enabled', 'expect' => [ 'endpoint' => [ 'url' => 'https://opsworks-cm-fips.us-east-2.api.aws', ], ], 'params' => [ 'Region' => 'us-east-2', 'UseDualStack' => true, 'UseFIPS' => true, ], ], [ 'documentation' => 'For region us-east-2 with FIPS enabled and DualStack disabled', 'expect' => [ 'endpoint' => [ 'url' => 'https://opsworks-cm-fips.us-east-2.amazonaws.com', ], ], 'params' => [ 'Region' => 'us-east-2', 'UseDualStack' => false, 'UseFIPS' => true, ], ], [ 'documentation' => 'For region us-east-2 with FIPS disabled and DualStack enabled', 'expect' => [ 'endpoint' => [ 'url' => 'https://opsworks-cm.us-east-2.api.aws', ], ], 'params' => [ 'Region' => 'us-east-2', 'UseDualStack' => true, 'UseFIPS' => false, ], ], [ 'documentation' => 'For region us-east-2 with FIPS disabled and DualStack disabled', 'expect' => [ 'endpoint' => [ 'url' => 'https://opsworks-cm.us-east-2.amazonaws.com', ], ], 'params' => [ 'Region' => 'us-east-2', 'UseDualStack' => false, 'UseFIPS' => false, ], ], [ 'documentation' => 'For custom endpoint with fips disabled and dualstack disabled', 'expect' => [ 'endpoint' => [ 'url' => 'https://example.com', ], ], 'params' => [ 'Region' => 'us-east-1', 'UseDualStack' => false, 'UseFIPS' => false, 'Endpoint' => 'https://example.com', ], ], [ 'documentation' => 'For custom endpoint with fips enabled and dualstack disabled', 'expect' => [ 'error' => 'Invalid Configuration: FIPS and custom endpoint are not supported', ], 'params' => [ 'Region' => 'us-east-1', 'UseDualStack' => false, 'UseFIPS' => true, 'Endpoint' => 'https://example.com', ], ], [ 'documentation' => 'For custom endpoint with fips disabled and dualstack enabled', 'expect' => [ 'error' => 'Invalid Configuration: Dualstack and custom endpoint are not supported', ], 'params' => [ 'Region' => 'us-east-1', 'UseDualStack' => true, 'UseFIPS' => false, 'Endpoint' => 'https://example.com', ], ], ], 'version' => '1.0',];
