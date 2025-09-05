import React from "react";

interface RoleDropdownProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    error?: string;
}

const roles = [
    { value: "", label: "Select your role", disabled: true },
    { value: "manager", label: "Manager" },
    { value: "director", label: "Director" },
    { value: "president", label: "President" },
    { value: "vice_president", label: "Vice President" },
    { value: "supervisor", label: "Supervisor" },
    { value: "member", label: "Member" },
];

const RoleDropdown: React.FC<RoleDropdownProps> = ({ value, onChange, error }) => (
    <div className="flex flex-col gap-1 w-full">
        <label htmlFor="role" className="text-sm font-medium text-gray-700">
            Role
        </label>
        <select
            id="role"
            name="role"
            value={value}
            onChange={onChange}
            className={`
        mt-1 block w-full px-4 py-2
        bg-white border border-gray-300 rounded-lg shadow-sm
        focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500
        text-gray-900 text-base
        transition
        ${error ? "border-red-500" : ""}
      `}
            required
        >
            {roles.map((role) => (
                <option
                    key={role.value}
                    value={role.value}
                    disabled={role.disabled}
                    hidden={role.disabled}
                >
                    {role.label}
                </option>
            ))}
        </select>
        {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
    </div>
);

export default RoleDropdown;
