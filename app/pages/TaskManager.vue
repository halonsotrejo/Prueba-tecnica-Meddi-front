<script setup lang="ts">
import {
  Save,
  Trash,
  SquarePen,
  SquareCheck,
  ListPlus,
  X,
} from "lucide-vue-next";
import dayjs from "dayjs";
const taskStore = useTaskStore();

const showForm = ref(false);
const isEditing = ref(false);
const editingId = ref<string | null>(null);

const filterDate = ref("all");
const sortOrder = ref("newest");
const searchQuery = ref("");

const priorityFilter = ref("all");

onMounted(async () => {
  console.log("Iniciando carga de tareas...");
  await taskStore.fetchTasks();
  console.log("Tareas cargadas exitosamente");
});

const groupedTasks = computed(() => {
  const baseTasks = filteredAndSortedTasks.value;

  const group = {
    Alta: [] as ITask,
    Media: [] as ITask,
    Baja: [] as ITask,
  };

  baseTasks.forEach((task) => {
    group[task.prioridad].push(task);
  });
  return group;
});

const filteredAndSortedTasks = computed(() => {
  let result = [...taskStore.tasks];
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter((t) => t.titulo.toLowerCase().includes(query));
  }

  if (priorityFilter.value !== "all") {
    result = result.filter((t) => t.prioridad === priorityFilter.value);
  }

  if (filterDate.value === "today") {
    const today = dayjs().startOf("day");
    result = result.filter((t) => dayjs(t.createdAt).isSame(today, "day"));
  } else if (filterDate.value === "week") {
    const startOfWeek = dayjs().startOf("week");
    result = result.filter((t) => dayjs(t.createdAt).isAfter(startOfWeek));
  }

  return result.sort((a, b) => {
    const dateA = dayjs(a.createdAt).valueOf();
    const dateB = dayjs(b.createdAt).valueOf();
    return sortOrder.value === "newest" ? dateB - dateA : dateA - dateB;
  });
});

const newTask = ref({
  titulo: "",
  descripcion: "",
  prioridad: "Baja" as "Baja" | "Media" | "Alta",
  fechaVencimiento: dayjs().add(10, "day").toISOString(),
  estado: "Pendiente" as "Pendiente" | "Completada",
});

async function handleSave() {
  if (!newTask.value.titulo) return alert("El título es obligatorio");

  let success = false;

  if (isEditing.value && editingId.value) {
    success = await taskStore.updateTask(editingId.value, newTask.value);
  } else {
    success = await taskStore.addTask(newTask.value);
  }
  if (success) {
    showForm.value = false;
    newTask.value = getInitialTask();
  }
}

async function handleEdit(task: ITask) {
  isEditing.value = true;
  editingId.value = task._id;

  newTask.value = {
    titulo: task.titulo,
    descripcion: task.descripcion,
    prioridad: task.prioridad,
    fechaVencimiento: task.fechaVencimiento,
    estado: task.estado,
  };
  showForm.value = true;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function handleDelete(id: string) {
  const confirmacion = confirm(
    "¿Estás seguro de que deseas eliminar esta tarea? Esta acción no se puede deshacer.",
  );
  if (confirmacion) {
    const success = await taskStore.deleteTask(id);
    if (success) console.log("Tarea eliminada...");
  }
}

async function handleStatus(task: ITask) {
  if (task.estado === "Completada") {
    alert("La tarea ya está completada");
    return;
  }
  const confirmacion = confirm(
    "¿Estás seguro de que deseas cambiar el estado a terminado?",
  );
  if (confirmacion) {
    const newStatus = task.estado === "Pendiente" ? "Completada" : "Pendiente";
    const success = await taskStore.updateTask(task._id, { estado: newStatus });
    if (success) console.log("Tarea actualizada exitosamente");
  }
}
</script>

<template>
  <GPageContainer>
    <h1 class="text-2xl font-bold">Administrador de tareas</h1>

    <div
      class="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between"
    >
      <Button
        @click="showForm = !showForm"
        :variant="showForm ? 'outline' : 'default'"
      >
        <ListPlus v-if="!showForm" class="w-4 h-4 mr-2" />
        {{ showForm ? "Cancelar" : "Nueva Tarea" }}
      </Button>

      <div class="flex flex-col gap-2">
        <span class="text-[10px] uppercase font-bold text-zinc-500 ml-1"
          >Prioridad</span
        >
        <Select v-model="priorityFilter">
          <SelectTrigger
            class="w-[180px] bg-zinc-950 border-zinc-800 text-zinc-300"
          >
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent class="bg-zinc-950 border-zinc-800 text-zinc-300">
            <SelectGroup>
              <SelectItem value="all">Todas las prioridades</SelectItem>
              <SelectItem value="Alta">
                <div class="flex items-center text-red-500">
                  <div class="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                  Alta
                </div>
              </SelectItem>
              <SelectItem value="Media">
                <div class="flex items-center text-yellow-500">
                  <div class="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                  Media
                </div>
              </SelectItem>
              <SelectItem value="Baja">
                <div class="flex items-center text-blue-500">
                  <div class="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                  Baja
                </div>
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div class="flex flex-col gap-2">
        <span class="text-[10px] uppercase font-bold text-zinc-500 ml-1"
          >Filtrar por fecha</span
        >
        <Select v-model="filterDate">
          <SelectTrigger
            class="w-[200px] bg-zinc-950 border-zinc-800 text-zinc-300"
          >
            <SelectValue placeholder="Seleccionar periodo" />
          </SelectTrigger>
          <SelectContent class="bg-zinc-950 border-zinc-800 text-zinc-300">
            <SelectGroup>
              <SelectItem value="all">Todas las tareas</SelectItem>
              <SelectItem value="today">Creadas hoy</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div class="flex flex-col gap-2">
        <span class="text-[10px] uppercase font-bold text-zinc-500 ml-1"
          >Ordenar cronológicamente</span
        >
        <Select v-model="sortOrder">
          <SelectTrigger
            class="w-[200px] bg-zinc-950 border-zinc-800 text-zinc-300"
          >
            <SelectValue placeholder="Seleccionar orden" />
          </SelectTrigger>
          <SelectContent class="bg-zinc-950 border-zinc-800 text-zinc-300">
            <SelectGroup>
              <SelectItem value="newest">Más recientes primero</SelectItem>
              <SelectItem value="oldest">Más antiguas primero</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div class="relative w-full max-w-md">
        <Search
          class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
        />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar tarea por título..."
          class="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700 transition-all"
        />
        <button
          v-if="searchQuery"
          @click="searchQuery = ''"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400"
        >
          <X class="w-3 h-3" />
        </button>
      </div>
    </div>

    <Card v-if="showForm" class="mb-8 border-primary/50 bg-zinc-900 text-white">
      <CardHeader>
        <CardTitle>Crear Nueva Tarea</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            v-model="newTask.titulo"
            placeholder="Título de la tarea"
            class="bg-zinc-800 border-zinc-700 p-2 rounded text-white"
          />
          <select
            v-model="newTask.prioridad"
            class="bg-zinc-800 border-zinc-700 p-2 rounded text-white"
          >
            <option value="Baja">Prioridad Baja</option>
            <option value="Media">Prioridad Media</option>
            <option value="Alta">Prioridad Alta</option>
          </select>
        </div>
        <textarea
          v-model="newTask.descripcion"
          placeholder="Descripción detallada..."
          class="w-full bg-zinc-800 border-zinc-700 p-2 rounded text-white h-24"
        >
        </textarea>
      </CardContent>
      <CardFooter class="justify-end gap-2">
        <Button variant="ghost" @click="showForm = false">
          <X />
          Descartar
        </Button>
        <Button @click="handleSave" :disabled="taskStore.isLoading">
          <Save />
          {{ taskStore.isLoading ? "Guardando..." : "Guardar Tarea" }}
        </Button>
      </CardFooter>
    </Card>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      <div class="space-y-4">
        <div
          class="flex items-center gap-2 border-b border-red-900/30 pb-2 mb-4"
        >
          <AlertCircle class="w-4 h-4 text-red-500" />
          <h3 class="font-bold text-red-500 uppercase text-xs tracking-widest">
            Prioridad Alta
          </h3>
          <span
            class="ml-auto bg-red-900/20 text-red-400 text-[10px] px-2 py-0.5 rounded-full"
          >
            {{ groupedTasks.Alta.length }}
          </span>
        </div>

        <Card
          v-for="task in groupedTasks.Alta"
          :key="task._id"
          class="flex flex-col bg-zinc-900 border-zinc-800 text-white overflow-hidden shadow-xl"
        >
          <CardHeader class="pb-2">
            <div class="flex justify-between items-start gap-4">
              <div class="space-y-1">
                <CardTitle
                  class="text-xl font-bold leading-none tracking-tight text-white"
                >
                  {{ task.titulo }}
                </CardTitle>
                <span class="text-[10px] text-zinc-500 font-mono">
                  {{ dayjs(task.createdAt).format("DD/MM/YYYY HH:mm") }}
                </span>
                <CardDescription class="text-xs text-zinc-500 font-mono">
                  ID: {{ task._id }}
                </CardDescription>
              </div>
              <Badge
                :variant="
                  task.prioridad === 'Alta' ? 'destructive' : 'secondary'
                "
                class="shrink-0"
              >
                {{ task.prioridad }}
              </Badge>
            </div>
          </CardHeader>

          <CardContent class="flex-grow pt-2">
            <p class="text-sm text-zinc-400 leading-relaxed italic">
              "{{ task.descripcion }}"
            </p>
          </CardContent>

          <CardFooter
            class="flex justify-between items-center gap-2 pt-4 border-t border-zinc-800 bg-zinc-900/50"
          >
            <Button
              size="sm"
              :variant="task.estado === 'Completada' ? 'secondary' : 'default'"
              :class="
                task.estado === 'Completada' ? 'bg-green-600 opacity-50' : ''
              "
              @click="handleStatus(task)"
            >
              <SquareCheck
                v-if="task.estado === 'Completada'"
                class="w-4 h-4 mr-2"
              />
              {{ task.estado === "Completada" ? "Hecho" : "Terminar" }}
            </Button>
            <div class="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                class="border-zinc-700 hover:bg-zinc-800"
                @click="handleEdit(task)"
              >
                <SquarePen />
                Editar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                @click="handleDelete(task._id)"
              >
                <Trash />
                Borrar
              </Button>
            </div>
          </CardFooter>
        </Card>
        <p
          v-if="groupedTasks.Alta.length === 0"
          class="text-zinc-600 text-xs italic text-center py-4"
        >
          No hay tareas de prioridad alta
        </p>
      </div>

      <div class="space-y-4">
        <div
          class="flex items-center gap-2 border-b border-red-900/30 pb-2 mb-4"
        >
          <AlertCircle class="w-4 h-4 text-red-500" />
          <h3 class="font-bold text-red-500 uppercase text-xs tracking-widest">
            Prioridad Media
          </h3>
          <span
            class="ml-auto bg-red-900/20 text-red-400 text-[10px] px-2 py-0.5 rounded-full"
          >
            {{ groupedTasks.Media.length }}
          </span>
        </div>

        <Card
          v-for="task in groupedTasks.Media"
          :key="task._id"
          class="flex flex-col bg-zinc-900 border-zinc-800 text-white overflow-hidden shadow-xl"
        >
          <CardHeader class="pb-2">
            <div class="flex justify-between items-start gap-4">
              <div class="space-y-1">
                <CardTitle
                  class="text-xl font-bold leading-none tracking-tight text-white"
                >
                  {{ task.titulo }}
                </CardTitle>
                <span class="text-[10px] text-zinc-500 font-mono">
                  {{ dayjs(task.createdAt).format("DD/MM/YYYY HH:mm") }}
                </span>
                <CardDescription class="text-xs text-zinc-500 font-mono">
                  ID: {{ task._id }}
                </CardDescription>
              </div>
              <Badge
                :variant="
                  task.prioridad === 'Alta' ? 'destructive' : 'secondary'
                "
                class="shrink-0"
              >
                {{ task.prioridad }}
              </Badge>
            </div>
          </CardHeader>

          <CardContent class="flex-grow pt-2">
            <p class="text-sm text-zinc-400 leading-relaxed italic">
              "{{ task.descripcion }}"
            </p>
          </CardContent>

          <CardFooter
            class="flex justify-between items-center gap-2 pt-4 border-t border-zinc-800 bg-zinc-900/50"
          >
            <Button
              size="sm"
              :variant="task.estado === 'Completada' ? 'secondary' : 'default'"
              :class="
                task.estado === 'Completada' ? 'bg-green-600 opacity-50' : ''
              "
              @click="handleStatus(task)"
            >
              <SquareCheck
                v-if="task.estado === 'Completada'"
                class="w-4 h-4 mr-2"
              />
              {{ task.estado === "Completada" ? "Hecho" : "Terminar" }}
            </Button>
            <div class="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                class="border-zinc-700 hover:bg-zinc-800"
                @click="handleEdit(task)"
              >
                <SquarePen />
                Editar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                @click="handleDelete(task._id)"
              >
                <Trash />
                Borrar
              </Button>
            </div>
          </CardFooter>
        </Card>
        <p
          v-if="groupedTasks.Media.length === 0"
          class="text-zinc-600 text-xs italic text-center py-4"
        >
          No hay tareas de prioridad media
        </p>
      </div>

      <div class="space-y-4">
        <div
          class="flex items-center gap-2 border-b border-red-900/30 pb-2 mb-4"
        >
          <AlertCircle class="w-4 h-4 text-red-500" />
          <h3 class="font-bold text-red-500 uppercase text-xs tracking-widest">
            Prioridad Baja
          </h3>
          <span
            class="ml-auto bg-red-900/20 text-red-400 text-[10px] px-2 py-0.5 rounded-full"
          >
            {{ groupedTasks.Baja.length }}
          </span>
        </div>

        <Card
          v-for="task in groupedTasks.Baja"
          :key="task._id"
          class="flex flex-col bg-zinc-900 border-zinc-800 text-white overflow-hidden shadow-xl"
        >
          <CardHeader class="pb-2">
            <div class="flex justify-between items-start gap-4">
              <div class="space-y-1">
                <CardTitle
                  class="text-xl font-bold leading-none tracking-tight text-white"
                >
                  {{ task.titulo }}
                </CardTitle>
                <span class="text-[10px] text-zinc-500 font-mono">
                  {{ dayjs(task.createdAt).format("DD/MM/YYYY HH:mm") }}
                </span>
                <CardDescription class="text-xs text-zinc-500 font-mono">
                  ID: {{ task._id }}
                </CardDescription>
              </div>
              <Badge
                :variant="
                  task.prioridad === 'Alta' ? 'destructive' : 'secondary'
                "
                class="shrink-0"
              >
                {{ task.prioridad }}
              </Badge>
            </div>
          </CardHeader>

          <CardContent class="flex-grow pt-2">
            <p class="text-sm text-zinc-400 leading-relaxed italic">
              "{{ task.descripcion }}"
            </p>
          </CardContent>

          <CardFooter
            class="flex justify-between items-center gap-2 pt-4 border-t border-zinc-800 bg-zinc-900/50"
          >
            <Button
              size="sm"
              :variant="task.estado === 'Completada' ? 'secondary' : 'default'"
              :class="
                task.estado === 'Completada' ? 'bg-green-600 opacity-50' : ''
              "
              @click="handleStatus(task)"
            >
              <SquareCheck
                v-if="task.estado === 'Completada'"
                class="w-4 h-4 mr-2"
              />
              {{ task.estado === "Completada" ? "Hecho" : "Terminar" }}
            </Button>
            <div class="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                class="border-zinc-700 hover:bg-zinc-800"
                @click="handleEdit(task)"
              >
                <SquarePen />
                Editar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                @click="handleDelete(task._id)"
              >
                <Trash />
                Borrar
              </Button>
            </div>
          </CardFooter>
        </Card>
        <p
          v-if="groupedTasks.Baja.length === 0"
          class="text-zinc-600 text-xs italic text-center py-4"
        >
          No hay tareas de prioridad baja
        </p>
      </div>
    </div>
  </GPageContainer>
</template>
