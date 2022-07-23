package com.tencent.tsf.femas.agent.apache.dubbo.nacos.instrument;

import com.tencent.tsf.femas.agent.dubbo.common.util.CommonUtils;
import com.tencent.tsf.femas.agent.interceptor.InstanceMethodsAroundInterceptor;
import com.tencent.tsf.femas.agent.interceptor.wrapper.InterceptResult;
import com.tencent.tsf.femas.api.ExtensionManager;
import com.tencent.tsf.femas.api.IExtensionLayer;
import com.tencent.tsf.femas.common.RegistryEnum;
import com.tencent.tsf.femas.common.serviceregistry.AbstractServiceRegistryMetadata;
import com.tencent.tsf.femas.common.serviceregistry.AbstractServiceRegistryMetadataFactory;
import org.apache.dubbo.registry.client.DefaultServiceInstance;

import java.lang.reflect.Method;
import java.util.Map;

/**
 * dubbo ServiceDiscovery Agent Interceptor
 */

public class NacosServiceDisocveryInterceptor implements InstanceMethodsAroundInterceptor<InterceptResult> {
    private volatile AbstractServiceRegistryMetadata serviceRegistryMetadata = AbstractServiceRegistryMetadataFactory
            .getServiceRegistryMetadata();
    private IExtensionLayer extensionLayer = ExtensionManager.getExtensionLayer();

    @Override
    public InterceptResult beforeMethod(Method method, Object[] allArguments, Class<?>[] argumentsTypes) throws Throwable {
        DefaultServiceInstance defaultServiceInstance = (DefaultServiceInstance) allArguments[0];
        Map<String, String> registerMetadataMap = serviceRegistryMetadata.getRegisterMetadataMap();
        registerMetadataMap.put("protocol", "apache-dubbo3-nacos-plugin");
        CommonUtils.beforeMethod(defaultServiceInstance, registerMetadataMap, RegistryEnum.NACOS, extensionLayer);
        return new InterceptResult();
    }

}
