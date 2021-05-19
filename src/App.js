import React from "react";
import { ChakraProvider, Tabs, TabList, TabPanels, Tab, TabPanel, Button, ButtonGroup, Flex, Spacer } from "@chakra-ui/react";
import "focus-visible/dist/focus-visible";

function App() {
	return <ChakraProvider>
		<Tabs variant="line">
			<TabList>
				<Tab>Connect</Tab>
				<Tab>Settings</Tab>
				<Tab>Appearance</Tab>
			</TabList>

			<TabPanels>
				<TabPanel /* Connect */>
					<Button mb={5}>Connect</Button>
				</TabPanel>
				<TabPanel /* Settings */>
					<p>two!</p>
				</TabPanel>
				<TabPanel /* Appearance */>
					<p>three!</p>
				</TabPanel>
			</TabPanels>
		</Tabs>
	</ChakraProvider>;
}

export default App;
