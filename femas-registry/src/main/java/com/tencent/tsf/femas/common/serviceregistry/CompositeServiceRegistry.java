package com.tencent.tsf.femas.common.serviceregistry;

import com.tencent.tsf.femas.common.entity.EndpointStatus;
import com.tencent.tsf.femas.common.entity.ServiceInstance;
import java.util.Collections;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author zhixinzxliu
 */
public class CompositeServiceRegistry implements ServiceRegistry {

    private static final Logger logger = LoggerFactory.getLogger(CompositeServiceRegistry.class);

    private final Map<String, ServiceRegistry> serviceRegistries = new ConcurrentHashMap<>();

    @Override
    public synchronized void register(ServiceInstance serviceInstance) {
        // 已注册的节点无需再次注册，如果改版状态，请使用setStatus方法
        for (Map.Entry<String, ServiceRegistry> entry : serviceRegistries.entrySet()) {
            String id = entry.getKey();
            ServiceRegistry serviceRegistry = entry.getValue();

            // 实际注册
            serviceRegistry.register(serviceInstance);
            logger.info("ServiceRegistry %s Register Service Instance %s success.", id, serviceInstance);
        }
    }

    @Override
    public synchronized void deregister(ServiceInstance serviceInstance) {
        for (Map.Entry<String, ServiceRegistry> entry : serviceRegistries.entrySet()) {
            String id = entry.getKey();
            ServiceRegistry serviceRegistry = entry.getValue();

            // 实际反注册
            serviceRegistry.deregister(serviceInstance);
            logger.info("ServiceRegistry %s Deregister Service Instance %s success.", id, serviceInstance);
        }
    }

    @Override
    public void close() {
        logger.info("Start to close the Composite Registry.");

        for (Map.Entry<String, ServiceRegistry> entry : serviceRegistries.entrySet()) {
            entry.getValue().close();
        }

        logger.info("End of close the Composite Registry.");
    }

    @Override
    public void setStatus(ServiceInstance serviceInstance, EndpointStatus status) {
        for (ServiceRegistry serviceRegistry : serviceRegistries.values()) {
            serviceRegistry.setStatus(serviceInstance, status);
        }
    }

    @Override
    public EndpointStatus getStatus(ServiceInstance serviceInstance) {
        throw new UnsupportedOperationException("Please query by a specific ServiceRegistry.");
    }

    /**
     * 移除某个注册中心
     * 由于是非频繁操作，直接synchronized即可
     * remove后可以从该ServiceRegistry移除已注册的节点
     *
     * @param serviceRegistryId 服务id
     * @return 返回被删除的注册中心
     */
    public synchronized ServiceRegistry removeServiceRegistry(String serviceRegistryId) {
        if (!serviceRegistries.containsKey(serviceRegistryId)) {
            logger.info("ServiceRegistry %s not exist.", serviceRegistryId);
            return null;
        }

        ServiceRegistry serviceRegistry = serviceRegistries.remove(serviceRegistryId);
        logger.info("ServiceRegistry %s removed.", serviceRegistryId);

        return serviceRegistry;
    }

    public synchronized void addServiceRegistry(String serviceRegistryId, ServiceRegistry serviceRegistry) {
        serviceRegistries.put(serviceRegistryId, serviceRegistry);
        logger.info("ServiceRegistry %s add.", serviceRegistryId);
    }

    public ServiceRegistry getServiceRegistries(String id) {
        return serviceRegistries.get(id);
    }

    public Map<String, ServiceRegistry> getServiceRegistries() {
        return Collections.unmodifiableMap(serviceRegistries);
    }
}
