import { defineStore } from 'pinia';

export interface ITask {
    _id: String,
    titulo: String,
    descripcion: String,
    prioridad: 'Baja' | 'Media' | 'Alta',
    fechaVencimiento: String,
    estado: 'Pendiente' | 'Completada',
    createdAt: String
}

// You can name the return value of `defineStore()` anything you want,
// but it's best to use the name of the store and surround it with `use`
// and `Store` (e.g. `useUserStore`, `useCartStore`, `useProductStore`)
// the first argument is a unique id of the store across your application

export const useTaskStore = defineStore('tasks', () => {
    const config = useRuntimeConfig();

    const tasks = ref<ITask[]>([]);
    const isLoading = ref(false);
    const apiBase = 'http://localhost:4000/tasksManager/tasks';


    async function fetchTasks() {
        isLoading.value = true;
        try {
            const data = await $fetch<ITask[]>(apiBase)
            tasks.value = data;
        } finally {
            isLoading.value = false;
        }
    }

    async function addTask(newTask: Partial<ITask>) {
        try {
            const savedTask = await $fetch<ITask>(apiBase, {
                method: 'POST',
                body: newTask
            });
            tasks.value.push(savedTask);
        } catch (error) {
            console.error('Error al crear:', error);
        }
    }

    async function deleteTask(id: string) {
        try {
            await $fetch(`${apiBase}/${id}`, {
                method: 'DELETE'
            });
            tasks.value = tasks.value.filter(t => t._id !== id);
        } catch (error) {
            console.error('Error al eliminar:', error);
        }
    }

    async function updateTask(id: string, updatedData: Partial<ITask>) {
        try {
            const data = await $fetch<ITask>(`${apiBase}/${id}`, {
                method: 'PUT',
                body: updatedData
            })

            const index = tasks.value.findIndex(t => t._id === id);
            if (index !== -1) {
                tasks.value[index] = data;
            }
        } catch (error) {
            console.error('Error al actualizar:', error)
        }
    }

    return {
        tasks,
        isLoading,
        fetchTasks,
        addTask,
        deleteTask,
        updateTask
    }
})