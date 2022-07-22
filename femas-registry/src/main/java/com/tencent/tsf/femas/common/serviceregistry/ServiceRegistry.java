package com.tencent.tsf.femas.common.serviceregistry;

import com.tencent.tsf.femas.common.entity.EndpointStatus;
import com.tencent.tsf.femas.common.entity.ServiceInstance;

/**
 * Contract to register and deregister instances with a Service Registry.
 */
public interface ServiceRegistry {

    /**
     * Register the serviceInstance. ServiceInstance typically have information about
     * instances such as: service, hostname, port.
     *
     * @param serviceInstance the serviceInstance
     */
    void register(ServiceInstance serviceInstance);

    /**
     * Deregister the serviceInstance.
     *
     * @param serviceInstance the serviceInstance
     */
    void deregister(ServiceInstance serviceInstance);

    /**
     * Close the ServiceRegistry.
     */
    void close();

    /**
     * Sets the status of the registration. The status values are determined
     * by the individual implementations.
     *
     * @param serviceInstance the serviceInstance to update
     * @param status the status to set
     */
    void setStatus(ServiceInstance serviceInstance, EndpointStatus status);

    /**
     * Gets the status of a particular registration.
     *
     * @param serviceInstance the serviceInstance to query
     * @return the status of the serviceInstance
     */
    EndpointStatus getStatus(ServiceInstance serviceInstance);
}
