"use client";

import { FormEvent, Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { addUserEmailToProduct } from "@/lib/actions";

interface Props{
  productId : string
}


const Modal = ({productId}: Props) => {
  let [isOpen, setIsOpen] = useState(true);
  const [isSubmitting, setisSubmitting] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {

    e.preventDefault(); //dont reload
    setisSubmitting(true);


    await addUserEmailToProduct(productId, email);

    setisSubmitting(false);
    setEmail('');
    closeModal()


  };

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <>
      <button type="button" className="btn" onClick={openModal}>
        Track Product
      </button>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-full p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md p-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                  <div className="flex justify-end">
                    <button
                      onClick={closeModal}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <span className="sr-only">Close</span>
                      &#x2715;
                    </button>
                  </div>
                  <div className="text-center">
                    <img
                      src="/assets/icons/mail.svg"
                      alt="Logo"
                      className="mx-auto mb-4 h-12 w-12"
                    />
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900"
                    >
                      Stay updated with product pricing alerts right in your
                      inbox!
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Never miss a bargain again with our timely alerts!
                      </p>
                    </div>
                    <div className="mt-4">
                      <form onSubmit={handleSubmit}>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Email address
                        </label>
                      </form>
                      <div className="mt-2 relative rounded-md shadow-sm">
                        <input
                          required
                          type="email"
                          name="email"
                          id="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-4"
                          placeholder="example@provider.com"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">
                            &#9993;
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <button
                        type="submit"
                        className="dialog-btn"
                        onClick={closeModal}
                      >
                        {isSubmitting ? "Submitting..." : "Track"}
                      </button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default Modal;
