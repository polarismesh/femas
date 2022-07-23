package com.tencent.tsf.femas.agent.apache.dubbo.nacos.instrument.router;

import org.apache.dubbo.common.URL;
import org.apache.dubbo.common.extension.Activate;
import org.apache.dubbo.rpc.cluster.Router;
import org.apache.dubbo.rpc.cluster.RouterFactory;

/**
 * apache dubbo3.03 RouterFactory spi impl
 */

@Activate(order = 99)
public class ApacheDubboAgentRouterFactory implements RouterFactory {

    @Override
    public Router getRouter(URL url) {
        return new ApacheDubboAgentRouter(url);
    }
}
