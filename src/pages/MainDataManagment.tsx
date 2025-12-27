import { useState, useEffect } from 'react';
import apiService from '../services/ApiService';
import { DataService, DataPipeline } from '../interfaces/Models';

function MainDataManagment() {
    const [activeTab, setActiveTab] = useState<'services' | 'pipelines'>('services');
    const [dataServices, setDataServices] = useState<DataService[]>([]);
    const [dataPipelines, setDataPipelines] = useState<DataPipeline[]>([]);
    const [newService, setNewService] = useState<DataService>({
        id: Date.now(),
        name: '',
        connectorConfigFields: [],
        description: '',
        type: 'IN',
        disabled: false, // Default to false
    });
    const [newPipeline, setNewPipeline] = useState<DataPipeline>({
        id: Date.now(),
        name: '',
        description: '',
        pipelineURL: '',
        disabled: false, // Default to false
    });

    useEffect(() => {
        // Fetch data services
        apiService.getDataServices()
            .then((response) => {
                setDataServices(
                    response.data.map((item: any) => ({
                        id: item.id,
                        name: item.name,
                        connectorConfigFields: item.connector_config_fields,
                        description: item.description,
                        type: item.type,
                        disabled: false, // Default to false
                    }))
                );
            })
            .catch((error) => console.error('Error fetching data services:', error));

        // Fetch data pipelines
        apiService.getDataPipelines()
            .then((response) => {
                setDataPipelines(
                    response.data.map((item: any) => ({
                        id: item.id,
                        name: item.name,
                        description: item.description,
                        pipelineURL: item.pipelineURL,
                        disabled: false, // Default to false
                    }))
                );
            })
            .catch((error) => console.error('Error fetching data pipelines:', error));
    }, []);

    const handleAddService = () => {
        apiService.addDataService(newService)
            .then(() => {
                setDataServices([...dataServices, newService]);
                setNewService({ id: Date.now(), name: '', connectorConfigFields: [], description: '', type: 'IN', disabled: false });
            })
            .catch((error) => console.error('Error adding data service:', error));
    };

    const handleAddPipeline = () => {
        apiService.addDataPipeline(newPipeline)
            .then(() => {
                setDataPipelines([...dataPipelines, newPipeline]);
                setNewPipeline({ id: Date.now(), name: '', description: '', pipelineURL: '', disabled: false });
            })
            .catch((error) => console.error('Error adding data pipeline:', error));
    };

    // Function to toggle the disabled state of a data service
    const toggleServiceDisabled = (id: number) => {
        const service = dataServices.find((service) => service.id === id);
        if (service && window.confirm(`Are you sure you want to ${service.disabled ? 'enable' : 'disable'} this service?`)) {
            apiService.toggleDataService(id, !service.disabled)
                .then(() => {
                    setDataServices((prevServices) =>
                        prevServices.map((service) =>
                            service.id === id ? { ...service, disabled: !service.disabled } : service
                        )
                    );
                })
                .catch((error) => console.error('Error toggling service disabled state:', error));
        }
    };

    // Function to toggle the disabled state of a data pipeline
    const togglePipelineDisabled = (id: number) => {
        const pipeline = dataPipelines.find((pipeline) => pipeline.id === id);
        if (pipeline && window.confirm(`Are you sure you want to ${pipeline.disabled ? 'enable' : 'disable'} this pipeline?`)) {
            apiService.toggleDataPipeline(id, !pipeline.disabled)
                .then(() => {
                    setDataPipelines((prevPipelines) =>
                        prevPipelines.map((pipeline) =>
                            pipeline.id === id ? { ...pipeline, disabled: !pipeline.disabled } : pipeline
                        )
                    );
                })
                .catch((error) => console.error('Error toggling pipeline disabled state:', error));
        }
    };

    return (
        <div className="w-full px-4 py-2">
            <div className="p-4 bg-white dark:bg-gray-900 dark:text-gray-300 rounded shadow-md">
                <h1 className="text-xl font-semibold mb-4">Data Management for all Agencies</h1>
                <div className="flex gap-4 mb-4">
                    <button
                        className={`px-4 py-2 rounded ${activeTab === 'services' ? 'bg-purple-500 text-white' : 'bg-gray-200 dark:bg-gray-800'}`}
                        onClick={() => setActiveTab('services')}
                    >
                        Data Services
                    </button>
                    <button
                        className={`px-4 py-2 rounded ${activeTab === 'pipelines' ? 'bg-purple-500 text-white' : 'bg-gray-200 dark:bg-gray-800'}`}
                        onClick={() => setActiveTab('pipelines')}
                    >
                        Data Pipelines
                    </button>
                </div>

                {activeTab === 'services' && (
                    <div>
                        <h2 className="text-lg font-medium mb-2">Manage Data Services</h2>
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Name"
                                value={newService.name}
                                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                                className="p-2 border rounded mr-2 bg-white dark:bg-gray-800 dark:text-gray-300"
                            />
                            <input
                                type="text"
                                placeholder="Connector Config Fields (comma-separated)"
                                value={newService.connectorConfigFields.join(',')}
                                onChange={(e) =>
                                    setNewService({ ...newService, connectorConfigFields: e.target.value.split(',') })
                                }
                                className="p-2 border rounded mr-2 bg-white dark:bg-gray-800 dark:text-gray-300 w-100" // Added w-80 for width
                            />
                            <input
                                type="text"
                                placeholder="Description"
                                value={newService.description}
                                onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                                className="p-2 border rounded mr-2 bg-white dark:bg-gray-800 dark:text-gray-300"
                            />
                            <select
                                value={newService.type}
                                onChange={(e) => setNewService({ ...newService, type: e.target.value as 'IN' | 'OUT' })}
                                className="p-2 border rounded mr-2 bg-white dark:bg-gray-800 dark:text-gray-300"
                            >
                                <option value="IN">IN</option>
                                <option value="OUT">OUT</option>
                            </select>
                            <button onClick={handleAddService} className="p-2 bg-purple-500 text-white rounded">
                                Add Service
                            </button>
                        </div>
                        <ul className="overflow-auto max-h-120">
                            {dataServices.map((service) => (
                                <li key={service.id} className="p-2 border-b border-gray-200 dark:border-gray-700">
                                    <strong>{service.name}</strong> - {service.type} - {service.description}
                                    <br />
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        Config Fields: {service.connectorConfigFields.join(', ')}
                                    </span>
                                    <br />
                                    <label className="flex items-center mt-2">
                                        <input
                                            type="checkbox"
                                            checked={!service.disabled}
                                            onChange={() => toggleServiceDisabled(service.id)}
                                            className="mr-2"
                                        />
                                        {service.disabled ? 'Disabled' : 'Enabled'}
                                    </label>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {activeTab === 'pipelines' && (
                    <div>
                        <h2 className="text-lg font-medium mb-2">Manage Data Pipelines</h2>
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Name"
                                value={newPipeline.name}
                                onChange={(e) => setNewPipeline({ ...newPipeline, name: e.target.value })}
                                className="p-2 border rounded mr-2 bg-white dark:bg-gray-800 dark:text-gray-300"
                            />
                            <input
                                type="text"
                                placeholder="Description"
                                value={newPipeline.description}
                                onChange={(e) => setNewPipeline({ ...newPipeline, description: e.target.value })}
                                className="p-2 border rounded mr-2 bg-white dark:bg-gray-800 dark:text-gray-300"
                            />
                            <input
                                type="text"
                                placeholder="Pipeline URL"
                                value={newPipeline.pipelineURL}
                                onChange={(e) => setNewPipeline({ ...newPipeline, pipelineURL: e.target.value })}
                                className="p-2 border rounded mr-2 bg-white dark:bg-gray-800 dark:text-gray-300"
                            />
                            <button onClick={handleAddPipeline} className="p-2 bg-purple-500 text-white rounded">
                                Add Pipeline
                            </button>
                        </div>
                        <ul className="overflow-auto max-h-120">
                            {dataPipelines.map((pipeline) => (
                                <li key={pipeline.id} className="p-2 border-b border-gray-200 dark:border-gray-700">
                                    <strong>{pipeline.name}</strong> - {pipeline.description}
                                    <br />
                                    <span className="text-sm text-gray-500 dark:text-gray-400">URL: {pipeline.pipelineURL}</span>
                                    <br />
                                    <label className="flex items-center mt-2">
                                        <input
                                            type="checkbox"
                                            checked={!pipeline.disabled}
                                            onChange={() => togglePipelineDisabled(pipeline.id)}
                                            className="mr-2"
                                        />
                                        {pipeline.disabled ? 'Disabled' : 'Enabled'}
                                    </label>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MainDataManagment;