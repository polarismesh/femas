package com.tencent.tsf.femas.common.serviceregistry;

import com.tencent.tsf.femas.common.entity.ServiceInstance;
import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author zhixinzxliu
 */
public abstract class AbstractServiceRegistry implements ServiceRegistry {

    protected final Logger logger = LoggerFactory.getLogger(AbstractServiceRegistry.class);

    private final Set<ServiceInstance> registered = Collections.newSetFromMap(new ConcurrentHashMap<>());

    @Override
    public synchronized void register(ServiceInstance serviceInstance) {
        if (serviceInstance == null) {
            throw new IllegalArgumentException("ServiceInstance cannot be null");
        }

        if (registered.contains(serviceInstance)) {
            logger.info("ServiceInstance {} is already been registered.", serviceInstance);
            return;
        }

        doRegister(serviceInstance);

        logger.info("ServiceInstance {} registered.", serviceInstance);
        registered.add(serviceInstance);
    }

    protected Set<ServiceInstance> getRegisteredServiceInstance() {
        return registered;
    }

    /**
     * 实际注册实例至注册中心的办法
     *
     * @param serviceInstance 服务实例
     */
    protected abstract void doRegister(ServiceInstance serviceInstance);

    @Override
    public synchronized void deregister(ServiceInstance serviceInstance) {
        if (serviceInstance == null) {
            throw new IllegalArgumentException("ServiceInstance cannot be null");
        }

        if (!registered.contains(serviceInstance)) {
            logger.info("ServiceInstance {} is already been deregistered.", serviceInstance);
            return;
        }

        doDeregister(serviceInstance);

        logger.info("ServiceInstance {} deregistered.", serviceInstance);
        registered.remove(serviceInstance);
    }

    @Override
    public void close() {
        for (ServiceInstance serviceInstance : registered) {
            this.deregister(serviceInstance);
        }
    }

    /**
     * 实际将实例反注册至注册中心的办法
     *
     * @param serviceInstance 服务实例
     */
    protected abstract void doDeregister(ServiceInstance serviceInstance);
}
