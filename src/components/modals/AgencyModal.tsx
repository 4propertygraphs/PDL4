import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { Agency } from '../../interfaces/Models';
import apiService from '../../services/ApiService';

interface AgencyModalProps {
    show: boolean;
    agency: Agency | null;
    onClose: () => void;
}

const AgencyModal: React.FC<AgencyModalProps> = ({ show, agency, onClose }) => {
    const [agencyData, setAgencyData] = useState<Agency | null>(null);
    const [formData, setFormData] = useState<Partial<Agency>>({});
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (show && agency?.id) {
                const response = await apiService.getAgency(agency?.id);
                setAgencyData(response.data);
                setFormData(response.data); // Initialize form data
            }
        };
        fetchData();
    }, [show, agency?.id]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (agency?.id) {
            await apiService.updateAgency(agency.id, formData);
            setAgencyData((prev) => ({ ...prev, ...formData } as Agency));
            setIsEditing(false);
        }
    };

    if (!agencyData) return null;

    return (
        <Modal show={show} onClose={onClose} title={`Agency Details: ${agencyData.name}`}>
            <div className="w-full overflow-y-auto max-h-130 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded p-4">
                <form className="w-full">
                    <table className="w-full text-left text-sm ">
                        <tbody>
                            {Object.entries(agencyData)
                                .filter(([key]) => key !== 'id') // Exclude the 'id' field
                                .map(([key]) => {
                                    const isGhlId = key === 'ghl_id';
                                    const isWhmcsId = key === 'whmcs_id';
                                    const value = agencyData[key as keyof Agency]?.toString();
                                    const link =
                                        isGhlId && value
                                            ? `https://4market.4property.com/v2/location/${value}/dashboard`
                                            : isWhmcsId && value
                                                ? `https://billing.4pm.ie/admin/clientssummary.php?userid=${value}`
                                                : null;

                                    return (
                                        <tr key={key} className="border-b border-gray-200 dark:border-gray-700">
                                            <th className="font-medium px-2 py-2 capitalize w-1/4">
                                                {link ? (
                                                    <a
                                                        href={link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-500 underline"
                                                    >
                                                        {key.replace(/([A-Z])/g, ' $1')}
                                                    </a>
                                                ) : (
                                                    key.replace(/([A-Z])/g, ' $1')
                                                )}
                                                :
                                            </th>
                                            <td className="px-2 py-1 w-3/4">
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        name={key}
                                                        value={formData[key as keyof Agency]?.toString() || ''}
                                                        onChange={handleInputChange}
                                                        className="w-full border border-gray-300 rounded px-2 py-1"
                                                    />
                                                ) : (
                                                    <span className="block w-full">
                                                        {value || 'N/A'}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </form>
                <div className="mt-4 flex justify-end space-x-2">
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleSave}
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                        >
                            Edit
                        </button>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default AgencyModal;