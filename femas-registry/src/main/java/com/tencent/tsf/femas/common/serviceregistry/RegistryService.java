package com.tencent.tsf.femas.common.serviceregistry;

import com.tencent.tsf.femas.common.spi.SpiService;
import com.tencent.tsf.femas.common.util.StringUtils;
import java.util.Map;

/**
 * 对多注册中心进行包装的公共service类
 *
 * @author zhixinzxliu
 */
public class RegistryService {

    /**
     * key是注册中心的类型
     * value是注册中心的类别
     */
    private static Map<String, ServiceRegistryFactory> REGISTRY_FACTORIES;

    /**
     * 创建新的Registry然后返回
     *
     * @param type 注册中心的类型
     * @param configs 配置参数
     * @return ServiceRegistry的具体实现，根据注册中心的类型决定
     */
    public static synchronized ServiceRegistry createRegistry(String type, Map<String, String> configs) {
        if (REGISTRY_FACTORIES == null) {
            REGISTRY_FACTORIES = SpiService.init(ServiceRegistryFactory.class);
        }

        ServiceRegistryFactory registryFactory = REGISTRY_FACTORIES.get(StringUtils.toUpperCase(type));
        if (registryFactory == null) {
            throw new IllegalArgumentException("Invalid type " + type + ". RegistryFactory : Type not registered.");
        }
        ServiceRegistry serviceRegistry = registryFactory.getServiceRegistry(configs);

        Runtime.getRuntime().addShutdownHook(new Thread(serviceRegistry::close));

        return serviceRegistry;
    }
}
