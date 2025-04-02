import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Checkbox } from "expo-checkbox";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StyleSheet } from "react-native";

type ToDoType = {
  id: number;
  title: string;
  isDone: boolean;
};

export default function App() {
  const [todos, setTodos] = useState<ToDoType[]>([]);
  const [todoText, setTodoText] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      const storedTodos = await AsyncStorage.getItem("my-todo");
      if (storedTodos) {
        setTodos(JSON.parse(storedTodos));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const addOrUpdateTodo = async () => {
    if (todoText.trim() === "") return;

    if (editingTodoId) {
      await updateTodo();
    } else {
      await addTodo();
    }

    resetTodoInput();
  };

  const updateTodo = async () => {
    const updatedTodos = todos.map(todo =>
      todo.id === editingTodoId ? { ...todo, title: todoText } : todo
    );
    setTodos(updatedTodos);
    await AsyncStorage.setItem("my-todo", JSON.stringify(updatedTodos));
    setSuccessMessage("Todo edited successfully!");
    setEditingTodoId(null);
  };

  const addTodo = async () => {
    const newTodo: ToDoType = {
      id: Math.random(),
      title: todoText,
      isDone: false,
    };
    const updatedTodos = [...todos, newTodo];
    setTodos(updatedTodos);
    await AsyncStorage.setItem("my-todo", JSON.stringify(updatedTodos));
    setSuccessMessage("Todo added successfully!");
  };

  const resetTodoInput = () => {
    setTodoText("");
    Keyboard.dismiss();
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const deleteTodo = async (id: number) => {
    const updatedTodos = todos.filter(todo => todo.id !== id);
    setTodos(updatedTodos);
    await AsyncStorage.setItem("my-todo", JSON.stringify(updatedTodos));
    setSuccessMessage("Todo deleted successfully!");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleDone = async (id: number) => {
    const updatedTodos = todos.map(todo =>
      todo.id === id ? { ...todo, isDone: !todo.isDone } : todo
    );
    setTodos(updatedTodos);
    await AsyncStorage.setItem("my-todo", JSON.stringify(updatedTodos));
  };

  const editTodo = (id: number, title: string) => {
    setEditingTodoId(id);
    setTodoText(title);
  };

  const filteredTodos = searchQuery
    ? todos.filter(todo =>
        todo.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : todos;

  return (
    <SafeAreaView style={styles.container}>
      <Header title="My Todo List" />
      <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <TodoList
        todos={filteredTodos}
        deleteTodo={deleteTodo}
        handleDone={handleDone}
        editTodo={editTodo}
      />
      {successMessage && <SuccessMessage message={successMessage} />}
      <TodoInput
        todoText={todoText}
        setTodoText={setTodoText}
        addOrUpdateTodo={addOrUpdateTodo}
        editingTodoId={editingTodoId}
      />
    </SafeAreaView>
  );
}

const Header = ({ title }: { title: string }) => (
  <View style={styles.header}>
    <Text style={styles.headerTitle}>{title}</Text>
  </View>
);

const SearchBar = ({ searchQuery, setSearchQuery }: { searchQuery: string; setSearchQuery: (text: string) => void }) => (
  <View style={styles.searchBar}>
    <TextInput
      placeholder="Search"
      value={searchQuery}
      onChangeText={setSearchQuery}
      style={styles.searchInput}
    />
  </View>
);

const TodoList = ({
  todos,
  deleteTodo,
  handleDone,
  editTodo,
}: {
  todos: ToDoType[];
  deleteTodo: (id: number) => void;
  handleDone: (id: number) => void;
  editTodo: (id: number, title: string) => void;
}) => (
  <FlatList
    data={todos.reverse()}
    keyExtractor={(item) => item.id.toString()}
    renderItem={({ item }) => (
      <ToDoItem
        todo={item}
        deleteTodo={deleteTodo}
        handleDone={handleDone}
        editTodo={editTodo}
      />
    )}
    style={styles.todoList}
  />
);

const ToDoItem = ({
  todo,
  deleteTodo,
  handleDone,
  editTodo,
}: {
  todo: ToDoType;
  deleteTodo: (id: number) => void;
  handleDone: (id: number) => void;
  editTodo: (id: number, title: string) => void;
}) => (
  <View style={styles.todoContainer}>
    <View style={styles.checkboxContainer}>
      <Checkbox
        value={todo.isDone}
        onValueChange={() => handleDone(todo.id)}
        color={todo.isDone ? "#4630EB" : undefined}
      />
    </View>
    
    <View style={styles.todoTextContainer}>
      <Text
        style={[
          styles.todoText,
          todo.isDone && { textDecorationLine: "line-through", color: "#A9A9A9" },
        ]}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {todo.title}
      </Text>
    </View>
    
    <View style={styles.todoActions}>
      <TouchableOpacity 
        onPress={() => editTodo(todo.id, todo.title)}
        style={styles.actionButton}
      >
        <Text style={styles.editButton}>Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        onPress={() => deleteTodo(todo.id)}
        style={styles.actionButton}
      >
        <Text style={styles.deleteButton}>Delete</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const SuccessMessage = ({ message }: { message: string }) => (
  <View style={styles.successMessage}>
    <Text style={styles.successText}>{message}</Text>
  </View>
);

const TodoInput = ({
  todoText,
  setTodoText,
  addOrUpdateTodo,
  editingTodoId,
}: {
  todoText: string;
  setTodoText: (text: string) => void;
  addOrUpdateTodo: () => void;
  editingTodoId: number | null;
}) => (
  <KeyboardAvoidingView
    style={styles.footer}
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    keyboardVerticalOffset={10}
  >
    <TextInput
      placeholder="Add Todo"
      value={todoText}
      onChangeText={setTodoText}
      style={styles.newTodoInput}
      autoCorrect={false}
    />
    <TouchableOpacity style={styles.addButton} onPress={addOrUpdateTodo}>
      <Text style={styles.addButtonText}>{editingTodoId ? "Update" : "Add"}</Text>
    </TouchableOpacity>
  </KeyboardAvoidingView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: "#f5f5f5",
  },
  header: {
    marginTop: 20,
    marginBottom: 10,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  searchBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    marginLeft: 10,
  },
  todoList: {
    flex: 1,
  },
  todoContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  checkboxContainer: {
    marginRight: 10,
    width: 24,
  },
  todoTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  todoText: {
    fontSize: 16,
    color: "#333",
  },
  todoActions: {
    flexDirection: "row",
    alignItems: "center",
    width: 110, // Fixed width to ensure buttons are always visible
    justifyContent: "flex-end",
  },
  actionButton: {
    padding: 8,
  },
  editButton: {
    color: "#4630EB",
    marginRight: 10,
    fontSize: 16,
  },
  deleteButton: {
    color: "red",
    fontSize: 16,
  },
  successMessage: {
    backgroundColor: "#dff0d8",
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
    alignItems: "center",
  },
  successText: {
    color: "#3c763d",
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    bottom: 20,
  },
  newTodoInput: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    fontSize: 16,
    color: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  addButton: {
    backgroundColor: "#4630EB",
    padding: 12,
    borderRadius: 10,
    marginLeft: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});