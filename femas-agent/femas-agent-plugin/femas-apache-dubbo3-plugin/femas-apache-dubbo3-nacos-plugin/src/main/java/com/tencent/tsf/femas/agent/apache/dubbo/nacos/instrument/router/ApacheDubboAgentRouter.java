package com.tencent.tsf.femas.agent.apache.dubbo.nacos.instrument.router;

import com.tencent.tsf.femas.agent.dubbo.common.util.CommonUtils;
import com.tencent.tsf.femas.api.ExtensionManager;
import com.tencent.tsf.femas.api.IExtensionLayer;
import com.tencent.tsf.femas.common.entity.Request;
import com.tencent.tsf.femas.common.entity.Service;
import com.tencent.tsf.femas.common.entity.ServiceInstance;
import org.apache.dubbo.common.URL;
import org.apache.dubbo.common.logger.Logger;
import org.apache.dubbo.common.logger.LoggerFactory;
import org.apache.dubbo.registry.client.InstanceAddressURL;
import org.apache.dubbo.rpc.Invocation;
import org.apache.dubbo.rpc.Invoker;
import org.apache.dubbo.rpc.RpcException;
import org.apache.dubbo.rpc.cluster.router.AbstractRouter;
import org.apache.dubbo.rpc.cluster.router.RouterResult;

import java.text.MessageFormat;
import java.util.*;

public class ApacheDubboAgentRouter extends AbstractRouter {
    private final Logger logger = LoggerFactory.getLogger(getClass());
    private IExtensionLayer extensionLayer = ExtensionManager.getExtensionLayer();

    public ApacheDubboAgentRouter(URL url) {
        super(url);
    }

    @Override
    public <T> RouterResult<Invoker<T>> route(List<Invoker<T>> invokers, URL url, Invocation invocation, boolean needToPrintMessage) throws RpcException {
        Service service = CommonUtils.buildService(url);
        Map<ServiceInstance,Invoker<T>> serviceInstanceInvokerMap = CommonUtils.parseInvokers(invokers, service);
        List<ServiceInstance> serviceInstanceList = new ArrayList<>(serviceInstanceInvokerMap.keySet());
        InstanceAddressURL instanceAddressURL = (InstanceAddressURL) invokers.get(0).getUrl();

        Request femasRequest = CommonUtils.getFemasRequest(instanceAddressURL, invocation);
        ServiceInstance instance = null;

        try {
            instance = extensionLayer.chooseServiceInstance(femasRequest, serviceInstanceList);
            logger.info(MessageFormat.format("instance:ip:{0}-port:{1}",instance.getHost(), instance.getPort()));

        } catch (Exception e) {
            return new RouterResult<Invoker<T>>(Collections.emptyList());
        }

       Invoker<T> invoker = serviceInstanceInvokerMap.get(instance);
        return new RouterResult<Invoker<T>>(Arrays.asList(invoker));
    }

}
