export const verifyUser = async (username, pass) => {
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify({ user: username, pass: pass }),
    });

    console.log('response', response);

    // if (!response.ok) {
    //   throw new Error(`Request failed with status: ${response.status}`);
    // }

    // const data = await response.json();
    return data; // Assuming the response contains the necessary information
  } catch (error) {
    console.error('Error in verifyUser:', error);
    return null; // Return null or handle the error appropriately
  }
};
