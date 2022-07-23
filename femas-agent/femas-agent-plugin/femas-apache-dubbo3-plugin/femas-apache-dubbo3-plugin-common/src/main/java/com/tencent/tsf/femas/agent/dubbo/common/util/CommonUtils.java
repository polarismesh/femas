package com.tencent.tsf.femas.agent.dubbo.common.util;

import com.tencent.tsf.femas.api.IExtensionLayer;
import com.tencent.tsf.femas.common.RegistryEnum;
import com.tencent.tsf.femas.common.context.Context;
import com.tencent.tsf.femas.common.context.ContextConstant;
import com.tencent.tsf.femas.common.context.factory.ContextFactory;
import com.tencent.tsf.femas.common.entity.Request;
import com.tencent.tsf.femas.common.entity.Service;
import com.tencent.tsf.femas.common.entity.ServiceInstance;
import com.tencent.tsf.femas.common.util.AddressUtils;
import org.apache.dubbo.common.URL;
import org.apache.dubbo.common.constants.CommonConstants;
import org.apache.dubbo.common.constants.RegistryConstants;
import org.apache.dubbo.registry.client.DefaultServiceInstance;
import org.apache.dubbo.registry.client.InstanceAddressURL;
import org.apache.dubbo.rpc.Invocation;
import org.apache.dubbo.rpc.Invoker;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.tencent.tsf.femas.common.context.ContextConstant.AGENT_REGISTER_TYPE_KEY;

public class CommonUtils {

    private static volatile ContextConstant contextConstant = ContextFactory.getContextConstantInstance();
    private static String namespace = Context.getSystemTag(contextConstant.getNamespaceId());

    private CommonUtils(){}

    public static <T> Map<ServiceInstance, Invoker<T>> parseInvokers(List<Invoker<T>> invokers, Service service) {
        Map<ServiceInstance, Invoker<T>> serviceInstances = new HashMap<>();
        for (Invoker<T> invoker : invokers) {
            serviceInstances.put(parseInvoker(invoker, service), invoker);
        }
        return serviceInstances;
    }

    public static <T> ServiceInstance parseInvoker(Invoker<T> invoker, Service service) {
        URL url = invoker.getUrl();
        ServiceInstance serviceInstance = new ServiceInstance();
        serviceInstance.setHost(url.getHost());
        serviceInstance.setPort(url.getPort());
        serviceInstance.setService(service);
        serviceInstance.setAllMetadata(url.getParameters());
        return serviceInstance;
    }

    public static Request getFemasRequest(URL url, Invocation invocation) {
        String serviceName = null;
        if (url instanceof InstanceAddressURL){
            InstanceAddressURL instanceAddressURL = (InstanceAddressURL) url;
            serviceName = instanceAddressURL.getInstance().getServiceName();
        }
        Service service = new Service(namespace, serviceName);
        Request femasRequest = new Request();
        femasRequest.setTargetMethodName(invocation.getMethodName());
        femasRequest.setInterfaceName(invocation.getMethodName());
        femasRequest.setTargetService(service);
        return femasRequest;
    }

    public static Service buildService(URL url) {
        return new Service(namespace, url.getServiceInterface());
    }

    public static void beforeMethod(DefaultServiceInstance defaultServiceInstance, Map<String, String> registerMetadataMap,RegistryEnum registryEnum, IExtensionLayer extensionLayer){
        List<DefaultServiceInstance.Endpoint> endpoints = defaultServiceInstance.getEndpoints();
        for (DefaultServiceInstance.Endpoint endpoint : endpoints) {
            InstanceAddressURL url = defaultServiceInstance.toURL(endpoint.getProtocol());
            ServiceInstance instance = createServiceInstance(url);
            Context.putSystemTag(AGENT_REGISTER_TYPE_KEY, registryEnum.getAlias());
            String namespace = Context.getSystemTag(contextConstant.getNamespaceId());
            Service service = new Service(namespace, url.getInstance().getServiceName());
            instance.setPort(url.getPort());
            instance.setService(service);
            instance.getAllMetadata().putAll(registerMetadataMap);
            extensionLayer.init(service, url.getPort());
            defaultServiceInstance.getMetadata().putAll(registerMetadataMap);
        }

    }

    private static ServiceInstance createServiceInstance(URL url) {
        ServiceInstance instance = new ServiceInstance(toServiceId(url),
                AddressUtils.getValidLocalHost(), url.getPort());
        String category = url.getParameter(RegistryConstants.CATEGORY_KEY, RegistryConstants.DEFAULT_CATEGORY);
        URL newURL = url.addParameter(RegistryConstants.CATEGORY_KEY, category);
        newURL = newURL.addParameter(CommonConstants.PROTOCOL_KEY, url.getProtocol());
        instance.setAllMetadata(new HashMap<>(newURL.getParameters()));
        return instance;
    }

    private static String toServiceId(URL url) {
        return url.getProtocol() + "#" + url.getHost() + "#" + url.getPort() + "#" + url.getServiceInterface();
    }
}
