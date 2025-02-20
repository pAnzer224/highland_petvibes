import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  addDoc,
  serverTimestamp,
  writeBatch,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase-config";
import { useAuth } from "../../hooks/useAuth";
import { ShoppingBag, X, Trash, Plus, Minus } from "lucide-react";
import { toast } from "react-toastify";

const CartModal = ({ isOpen, onClose }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const cartQuery = query(
      collection(db, "cart"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(cartQuery, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCartItems(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      const cartItemRef = doc(db, "cart", itemId);
      await updateDoc(cartItemRef, {
        quantity: newQuantity,
      });
      toast.success("Quantity updated");
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Failed to update quantity");
    }
  };

  const placeOrder = async () => {
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    try {
      const batch = writeBatch(db);
      const timestamp = serverTimestamp(); // Create a single timestamp for all orders

      const orderPromises = cartItems.map(async (item) => {
        const orderRef = await addDoc(collection(db, "orders"), {
          userId: currentUser.uid,
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          price: item.price,
          quantity: item.quantity,
          status: "Pending",
          createdAt: timestamp, // Use the same timestamp
          userName: currentUser.displayName || "Unknown User",
        });

        const cartItemRef = doc(db, "cart", item.id);
        batch.delete(cartItemRef);

        return orderRef;
      });

      await Promise.all(orderPromises);
      await batch.commit();

      // Add a small delay before navigation to ensure Firestore has time to update
      setTimeout(() => {
        toast.success("Order placed successfully!");
        onClose();
        navigate("/user/orders");
      }, 1000);
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order");
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      await deleteDoc(doc(db, "cart", itemId));
      toast.success("Item removed from cart");
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Failed to remove item");
    }
  };

  if (!isOpen) return null;

  const calculateTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  return (
    <div className="fixed top-[148px] right-6 z-50">
      <div className="w-96 bg-background border-[1.6px] border-green2 rounded-2xl shadow-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <ShoppingBag className="text-green2" size={24} />
              <h2 className="text-xl font-bold text-green2">Shopping Cart</h2>
            </div>
            <button
              onClick={onClose}
              className="text-text/60 hover:text-text transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-text/60">Loading cart...</p>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-text/60">Your cart is empty</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-background border-[1.6px] border-green2/30 rounded-xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="size-20 object-cover rounded-xl"
                      />
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-text">
                          {item.productName}
                        </h3>
                        <p className="text-primary font-nunito-semibold">
                          ₱{item.price}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            className="p-1 rounded-full bg-green2/10 hover:bg-green2/20 text-green2 transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-sm text-text min-w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            className="p-1 rounded-full bg-green2/10 hover:bg-green2/20 text-green2 transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red/80 hover:text-red transition-colors"
                      >
                        <Trash size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t border-green2/30 pt-4">
                <div className="flex justify-between mb-4">
                  <span className="font-semibold text-text">Total:</span>
                  <span className="font-bold text-primary">
                    ₱{calculateTotal()}
                  </span>
                </div>
                <button
                  onClick={placeOrder}
                  className="w-full px-4 py-2 bg-green3 text-text rounded-full hover:bg-green3/80 transition-colors border-[1.6px] border-green2 flex items-center justify-center gap-2"
                >
                  Place Order
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartModal;
