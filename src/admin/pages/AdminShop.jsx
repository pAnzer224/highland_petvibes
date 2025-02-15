import React, { useState, useEffect } from "react";
import { PlusCircle, Edit, Trash2, CheckCircle } from "lucide-react";
import StatusDropdown from "../../components/StatusDropdown";
import useFirestoreCrud from "../../hooks/useFirestoreCrud";

function importAllImages(requireContext) {
  return requireContext.keys().map(requireContext);
}

function AdminShop() {
  const {
    items: products,
    createItem,
    updateItem,
    deleteItem,
  } = useFirestoreCrud("products");
  const {
    items: orders,
    updateItem: updateOrder,
    deleteItem: deleteOrder,
  } = useFirestoreCrud("orders", {
    orderBy: { field: "createdAt", direction: "desc" },
  });

  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    description: "",
    price: "",
    stock: "",
    image: "/images/shop-images/default-image.jpg",
  });

  const shopImages = importAllImages(
    require.context("/public/images/shop-images/", false, /\.(png|jpe?g|svg)$/)
  );

  const categories = [
    "All Categories",
    "Food & Treats",
    "Toys",
    "Beds & Furniture",
    "Accessories",
    "Health & Wellness",
  ];

  useEffect(() => {
    if (selectedImage) {
      setNewProduct((prev) => ({
        ...prev,
        image: selectedImage,
      }));
    }
  }, [selectedImage]);

  const handleAddProduct = async (e) => {
    e.preventDefault();

    try {
      const productToAdd = {
        ...newProduct,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock),
        status: Number(newProduct.stock) > 20 ? "In Stock" : "Low Stock",
        image: selectedImage || newProduct.image,
      };

      if (isEditMode && editingProduct) {
        await updateItem(editingProduct.id, productToAdd);
      } else {
        await createItem(productToAdd);
      }

      setIsModalOpen(false);
      setNewProduct({
        name: "",
        category: "",
        description: "",
        price: "",
        stock: "",
        image: "/images/shop-images/default-image.jpg",
      });
      setSelectedImage(null);
      setIsEditMode(false);
      setEditingProduct(null);
    } catch (e) {
      console.error("Error adding/updating document: ", e);
    }
  };

  const handleEdit = (product) => {
    setIsEditMode(true);
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      category: product.category,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      image: product.image,
    });
    setSelectedImage(product.image);
    setIsModalOpen(true);
  };

  const handleConfirmOrder = async (orderId) => {
    try {
      await updateOrder(orderId, { status: "Confirmed" });
    } catch (e) {
      console.error("Error confirming order: ", e);
    }
  };

  const handleReceiveOrder = async (orderId) => {
    try {
      await updateOrder(orderId, { status: "Received" });
    } catch (e) {
      console.error("Error marking order as received: ", e);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      selectedCategory === "All Categories" ||
      product.category === selectedCategory
  );

  const sortedOrders = [...orders].sort((a, b) => {
    const statusOrder = {
      Pending: 0,
      Cancelled: 0,
      Confirmed: 1,
      Received: 2,
    };

    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }

    return b.createdAt.seconds - a.createdAt.seconds;
  });

  return (
    <div className="space-y-6 mt-14">
      <div className="flex justify-between items-center gap-4">
        <StatusDropdown
          statusOptions={categories}
          selectedStatus={selectedCategory}
          onStatusChange={setSelectedCategory}
        />

        <button
          onClick={() => {
            setIsEditMode(false);
            setEditingProduct(null);
            setNewProduct({
              name: "",
              category: "",
              description: "",
              price: "",
              stock: "",
              image: "/images/shop-images/default-image.jpg",
            });
            setSelectedImage(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center whitespace-nowrap px-4 py-2 bg-green2 text-background rounded-full hover:bg-green2/80 transition-colors font-nunito text-sm md:text-base"
        >
          <PlusCircle className="w-4 h-4 md:w-5 md:h-5 mr-2" />
          Add Product
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 font-nunito-semibold tracking-wide text-sm md:text-base px-4">
          <form
            onSubmit={handleAddProduct}
            className="bg-background p-4 sm:p-8 rounded-2xl w-full max-w-md border-[1.6px] border-green2"
          >
            <input
              type="text"
              placeholder="Product Name"
              value={newProduct.name}
              onChange={(e) =>
                setNewProduct({ ...newProduct, name: e.target.value })
              }
              className="w-full mb-2 p-2 px-4 border-[1.6px] border-green2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green2 focus:border-transparent text-sm md:text-base"
              required
            />
            <div className="w-full mb-4">
              <p className="text-sm md:text-base text-text/70 mb-2">
                Select Product Image:
              </p>
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {shopImages.map((image, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedImage(image)}
                    className={`
                      w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-lg cursor-pointer 
                      border-2 transition-all duration-200
                      ${
                        selectedImage === image
                          ? "border-green2 ring-2 ring-green2/50"
                          : "border-transparent hover:border-green2/50"
                      }
                    `}
                  >
                    <img
                      src={image}
                      alt={`Product option ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </div>

            <select
              value={newProduct.category}
              onChange={(e) =>
                setNewProduct({ ...newProduct, category: e.target.value })
              }
              className="w-full mb-2 p-2 px-4 border-[1.6px] border-green2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green2 focus:border-transparent text-sm md:text-base"
              required
            >
              <option value="">Select Category</option>
              {categories.slice(1).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <textarea
              placeholder="Description"
              value={newProduct.description}
              onChange={(e) =>
                setNewProduct({ ...newProduct, description: e.target.value })
              }
              className="w-full mb-2 p-2 px-4 border-[1.6px] border-green2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green2 focus:border-transparent text-sm md:text-base"
              required
              rows={3}
            />
            <div className="relative mb-2">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 font-nunito-bold text-primary/80 text-sm md:text-base">
                ₱
              </span>
              <input
                type="text"
                placeholder="Price"
                value={newProduct.price}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.]/g, "");
                  setNewProduct({ ...newProduct, price: value });
                }}
                className="w-full p-2 pl-7 border-[1.6px] border-green2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green2 focus:border-transparent text-sm md:text-base"
                required
              />
            </div>
            <input
              type="text"
              placeholder="Stock"
              value={newProduct.stock}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, "");
                setNewProduct({ ...newProduct, stock: value });
              }}
              className="w-full mb-2 p-2 px-4 border-[1.6px] border-green2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green2 focus:border-transparent text-sm md:text-base"
              required
            />
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors font-nunito text-sm md:text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green2 text-background rounded-full hover:bg-green2/80 transition-colors font-nunito-semibold text-sm md:text-base"
              >
                {isEditMode ? "Update Product" : "Add Product"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border-[1.6px] border-green2">
        <table className="w-full bg-background border-collapse">
          <thead>
            <tr className="bg-green3/20 font-nunito-bold text-text">
              <th className="p-3 text-left text-base">Product Name</th>
              <th className="hidden md:table-cell p-3 text-left text-base">
                Category
              </th>
              <th className="hidden md:table-cell p-3 text-left text-base">
                Description
              </th>
              <th className="p-3 text-left text-base">Price/Stock</th>
              <th className="hidden md:table-cell p-3 text-left text-base">
                Stock
              </th>
              <th className="p-3 text-left text-base">Status</th>
              <th className="p-3 text-center text-base">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr
                key={product.id}
                className="border-b border-green3/30 hover:bg-green3/10 font-nunito-semibold text-text/80"
              >
                <td className="p-3 font-nunito-bold text-base">
                  {product.name}
                </td>
                <td className="hidden md:table-cell p-3 text-base">
                  {product.category}
                </td>
                <td className="hidden md:table-cell p-3 text-base">
                  {product.description}
                </td>
                <td className="p-3 text-base">
                  <div className="flex flex-col">
                    <span>₱{product.price}</span>
                    <span
                      className={`md:hidden text-base ${
                        product.stock <= 20
                          ? "text-yellow-600"
                          : "text-green-600"
                      }`}
                    >
                      {product.stock} left
                    </span>
                  </div>
                </td>
                <td className="hidden md:table-cell p-3 text-base">
                  {product.stock}
                </td>
                <td className="p-3">
                  <span
                    className={`
                  inline-flex whitespace-nowrap px-3 py-1 rounded-full text-base font-nunito-bold
                  ${
                    product.status === "In Stock"
                      ? "bg-green3/50 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }
                `}
                  >
                    {product.status}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-green2 hover:text-green2/80 transition-colors"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => deleteItem(product.id)}
                      className="text-red/80 hover:text-red transition-colors"
                    >
                      <Trash2 className="size-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-nunito-bold text-green2 mb-4">
          Order History
        </h2>
        <span className="px-2.5 py-1 bg-green3/30 text-green2 rounded-full text-sm font-nunito-bold border border-green2">
          {orders.length} Orders
        </span>
        <div className="grid gap-3 pt-5">
          {sortedOrders.map((order) => (
            <div
              key={order.id}
              className="bg-background/95 p-4 rounded-lg border border-green2/60 shadow-sm hover:shadow-[0_0_0_1px] hover:shadow-green2"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-nunito-bold text-primary">
                    {order.userName}
                  </h3>
                  <p className="text-sm">
                    <span className="font-nunito-semibold text-green2">
                      Product:
                    </span>{" "}
                    <span className="text-text/80 font-nunito-semibold">
                      {order.productName}
                    </span>
                  </p>
                  <p className="text-primary font-nunito-semibold mt-1 text-base">
                    ₱{order.price * order.quantity}
                  </p>
                  <div className="mt-1">
                    <span className="text-sm text-text/60 font-nunito-semibold">
                      Order Date:{" "}
                      {order.createdAt
                        ? new Date(
                            order.createdAt.seconds * 1000
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "Date not available"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {order.status !== "Confirmed" &&
                    order.status !== "Received" && (
                      <button
                        onClick={() => handleConfirmOrder(order.id)}
                        className="px-3 py-1.5 bg-green3 text-text rounded-full hover:bg-green3/80 transition-colors border border-green2 flex items-center gap-1.5 text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Confirm
                      </button>
                    )}
                  {order.status === "Confirmed" &&
                    order.status !== "Received" && (
                      <button
                        onClick={() => handleReceiveOrder(order.id)}
                        className="px-3 py-1.5 bg-green3 text-text rounded-full hover:bg-green3/80 transition-colors border border-green2 flex items-center gap-1.5 text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Received
                      </button>
                    )}
                  {order.status === "Received" && (
                    <span className="px-3 py-1.5 bg-green3/30 text-text rounded-full border border-green2 flex items-center gap-1.5 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Completed
                    </span>
                  )}
                  <button
                    onClick={() => deleteOrder(order.id)}
                    className="px-3 py-1.5 bg-red/10 text-red rounded-full hover:bg-red/20 transition-colors border border-red/60 flex items-center gap-1.5 text-sm"
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminShop;
