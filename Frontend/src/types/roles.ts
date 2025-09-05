export type Role = 'president' | 'vicePresident' | 'director' | 'manager' | 'teamLeader' | 'supervisor' | 'member';

export interface RoleHierarchy {
    president: {
        canAdd: ['vicePresident'];
        canView: ['vicePresident', 'director', 'manager', 'teamLeader', 'supervisor', 'member'];
    };
    vicePresident: {
        canAdd: ['director'];
        canView: ['director', 'manager', 'teamLeader', 'supervisor', 'member'];
    };
    director: {
        canAdd: ['manager'];
        canView: ['manager', 'teamLeader', 'supervisor', 'member'];
    };
    manager: {
        canAdd: ['teamLeader', 'supervisor'];
        canView: ['teamLeader', 'supervisor', 'member'];
    };
    teamLeader: {
        canAdd: ['member'];
        canView: ['member'];
    };
    supervisor: {
        canAdd: ['member'];
        canView: ['member'];
    };
    member: {
        canAdd: [];
        canView: [];
    };
}

export const roleHierarchy: RoleHierarchy = {
    president: {
        canAdd: ['vicePresident'],
        canView: ['vicePresident', 'director', 'manager', 'teamLeader', 'supervisor', 'member'],
    },
    vicePresident: {
        canAdd: ['director'],
        canView: ['director', 'manager', 'teamLeader', 'supervisor', 'member'],
    },
    director: {
        canAdd: ['manager'],
        canView: ['manager', 'teamLeader', 'supervisor', 'member'],
    },
    manager: {
        canAdd: ['teamLeader', 'supervisor'],
        canView: ['teamLeader', 'supervisor', 'member'],
    },
    teamLeader: {
        canAdd: ['member'],
        canView: ['member'],
    },
    supervisor: {
        canAdd: ['member'],
        canView: ['member'],
    },
    member: {
        canAdd: [],
        canView: [],
    },
};
