import {
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Checkbox } from "expo-checkbox";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
    const getTodos = async () => {
      try {
        const storedTodos = await AsyncStorage.getItem("my-todo");
        if (storedTodos) {
          setTodos(JSON.parse(storedTodos));
        }
      } catch (error) {
        console.error(error);
      }
    };
    getTodos();
  }, []);

  const addOrUpdateTodo = async () => {
    if (todoText.trim() === "") return; // Prevent adding empty todos

    if (editingTodoId) {
      // Update existing todo
      const updatedTodos = todos.map((todo) =>
        todo.id === editingTodoId ? { ...todo, title: todoText } : todo
      );
      setTodos(updatedTodos);
      await AsyncStorage.setItem("my-todo", JSON.stringify(updatedTodos));
      setSuccessMessage("Todo edited successfully!");
      setEditingTodoId(null);
    } else {
      // Add new todo
      const newTodo: ToDoType = {
        id: Math.random(),
        title: todoText,
        isDone: false,
      };
      const updatedTodos = [...todos, newTodo];
      setTodos(updatedTodos);
      await AsyncStorage.setItem("my-todo", JSON.stringify(updatedTodos));
      setSuccessMessage("Todo added successfully!");
    }
    
    setTodoText("");
    Keyboard.dismiss();
    
    // Clear message after a few seconds
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const deleteTodo = async (id: number) => {
    const updatedTodos = todos.filter((todo) => todo.id !== id);
    setTodos(updatedTodos);
    await AsyncStorage.setItem("my-todo", JSON.stringify(updatedTodos));
    setSuccessMessage("Todo deleted successfully!");

    // Clear message after a few seconds
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleDone = async (id: number) => {
    const updatedTodos = todos.map((todo) =>
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
    ? todos.filter((todo) =>
        todo.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : todos;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          placeholder="Search"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
      </View>

      <FlatList
        data={filteredTodos.reverse()}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ToDoItem
            todo={item}
            deleteTodo={deleteTodo}
            handleDone={handleDone}
            editTodo={editTodo}
          />
        )}
      />

      {successMessage ? (
        <View style={styles.successMessage}>
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      ) : null}

      <KeyboardAvoidingView
        style={styles.footer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={10}
      >
        <TextInput
          placeholder="Add or Edit Todo"
          value={todoText}
          onChangeText={setTodoText}
          style={styles.newTodoInput}
          autoCorrect={false}
        />
        <TouchableOpacity style={styles.addButton} onPress={addOrUpdateTodo}>
          <Text style={styles.addButtonText}>{editingTodoId ? "Update" : "Add"}</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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
    <View style={styles.todoInfoContainer}>
      <Checkbox
        value={todo.isDone}
        onValueChange={() => handleDone(todo.id)}
        color={todo.isDone ? "#4630EB" : undefined}
      />
      <Text
        style={[
          styles.todoText,
          todo.isDone && { textDecorationLine: "line-through", color: "#A9A9A9" },
        ]}
      >
        {todo.title}
      </Text>
    </View>
    <View style={styles.todoActions}>
      <TouchableOpacity onPress={() => editTodo(todo.id, todo.title)}>
        <Text style={styles.editButton}>Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => deleteTodo(todo.id)}>
        <Text style={styles.deleteButton}>Delete</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: "#f5f5f5",
  },
  searchBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    alignItems: "center",
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    marginLeft: 10,
  },
  todoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: "center",
  },
  todoInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  todoText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 10,
  },
  todoActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  editButton: {
    color: "#4630EB",
    marginRight: 10,
  },
  deleteButton: {
    color: "red",
  },
  successMessage: {
    backgroundColor: "#dff0d8",
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
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
  },
  addButton: {
    backgroundColor: "#4630EB",
    padding: 8,
    borderRadius: 10,
    marginLeft: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});