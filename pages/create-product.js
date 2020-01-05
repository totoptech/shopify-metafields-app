import React from "react";
import {
  Card,
  List,
  Page,
  Thumbnail,
  TextField,
  Layout,
  Button,
  Heading,
  Subheading,
  ButtonGroup,
  Icon,
  AppProvider,
  ContextualSaveBar,
  Frame
} from "@shopify/polaris";
import { DeleteMinor } from "@shopify/polaris-icons";
import { Redirect } from "@shopify/app-bridge/actions";
import { Context } from "@shopify/app-bridge-react";

import gql from "graphql-tag";
import store from "store-js";
import "./style.css";
import MetafieldCard from "../components/MetafieldCard";

class CreateProduct extends React.Component {
  state = {
    id: "",
    price: "",
    title: "",
    image: "",
    metafields: [],
    newcount: 0
  };
  componentDidMount() {
    this.getItem();
  }
  getItem = async () => {
    const item = store.get("item");
    const image = item.images.edges[0]
      ? item.images.edges[0].node.originalSrc
      : "";
    const price = item.variants.edges[0].node.price;
    const title = item.title;
    const id = item.id;
    console.log("TITLE", title);
    const response = await this.Get_Metafields(title);

    var metafields = [];
    response.forEach(item => {
      metafields.push(item.node);
    });
    console.log("METAFIELDS", metafields);
    this.setState({ price, image, title, id, metafields });
  };

  Create_Product = async metafields => {
    const UPDATE_METAFIELDS = JSON.stringify({
      query: `mutation($input: ProductInput!) {
				productCreate(input:$input) 
				{
					userErrors {
					  field
					  message
					}
				}
			}`,
      variables: {
        input: {
          title: "Carrot",
          metafields: metafields
        }
      }
    });
    const response = await this.Fetch_GraphQL(UPDATE_METAFIELDS);
    return response;
  };

  UpdateMetafields = async (id, metafields) => {
    const UPDATE_METAFIELDS = JSON.stringify({
      query: `mutation($input: ProductInput!) {
				productUpdate(input:$input) 
				{
					userErrors {
					  field
					  message
					}
				}
			}`,
      variables: {
        input: {
          id: id,
          metafields: metafields
        }
      }
    });
    const response = await this.Fetch_GraphQL(UPDATE_METAFIELDS);
    return response;
  };

  Get_Metafields = async title => {
    const GET_METAFIELDS = JSON.stringify({
      query: `{
				productByHandle(handle: "${title}") {
				  metafields(first: 10) {
					edges {
					  node {
						key
						value
						valueType
						namespace
						id
					  }
					}
				  }
				}
			}`
    });
    const response = await this.Fetch_GraphQL(GET_METAFIELDS);

    return response.data.productByHandle.metafields.edges;
  };

  Fetch_GraphQL = async fields => {
    const response = await fetch(
      `https://cors-anywhere.herokuapp.com/https://granitedevstore2.myshopify.com/admin/api/2019-07/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": ACCESS_TOKEN
        },
        body: fields
      }
    );
    const responseJson = await response.json();
    return responseJson;
  };

  ValueChange = (id, value) => {
    var metafields = [...this.state.metafields];
    const index = metafields.findIndex(item => item.id === id);
    metafields[index].value = value;
    this.setState({ metafields });
  };
  ValueTypeChange = (id, value) => {
    var metafields = [...this.state.metafields];
    const index = metafields.findIndex(item => item.id === id);
    metafields[index].valueType = value;
    this.setState({ metafields });
  };
  KeyChange = (id, value) => {
    var metafields = [...this.state.metafields];
    const index = metafields.findIndex(item => item.id === id);
    metafields[index].key = value;
    this.setState({ metafields });
  };
  NameSpaceChange = (id, value) => {
    var metafields = [...this.state.metafields];
    const index = metafields.findIndex(item => item.id === id);
    metafields[index].namespace = value;
    this.setState({ metafields });
  };

  handleCreate = async () => {
    var metafields = [...this.state.metafields];
    const newcount = this.state.newcount;
    metafields.push({
      key: "",
      value: "",
      valueType: "",
      namespace: "",
      id: newcount,
      enabled: true
    });
    this.setState({ metafields, newcount: newcount + 1 });
  };

  handleSave = async () => {
    console.log("Save clicked");
    const { metafields, id } = this.state;
    var up_metafields = [];

    metafields.map(item => {
      item.enabled === undefined
        ? up_metafields.push({ id: item.id, value: item.value })
        : up_metafields.push({
            key: item.key,
            value: item.value,
            valueType: item.valueType,
            namespace: item.namespace
          });
    });
    console.log("AR_METAFIELS", up_metafields);

    const response = await this.UpdateMetafields(id, up_metafields);
    console.log("SET RESPONSE", response);
  };

  static contextType = Context;
  render() {
    console.log(this.state);
    const { title, image, metafields } = this.state;

    const app = this.context;
    const redirectToProduct = () => {
      const redirect = Redirect.create(app);
      redirect.dispatch(Redirect.Action.APP, "/products");
    };

    const card_section = metafields.map((item, index) => {
      return (
        <MetafieldCard
          item={item}
          index={index}
          key={item.id}
          ValueChange={this.ValueChange}
          ValueTypeChange={this.ValueTypeChange}
          KeyChange={this.KeyChange}
          NameSpaceChange={this.NameSpaceChange}
        />
      );
    });

    return (
      // <Frame>
      //   <ContextualSaveBar
      //     alignContentFlush
      //     message="Unsaved changes"
      //     saveAction={{
      //       onAction: () => console.log("add form submit logic")
      //     }}
      //     discardAction={{
      //       onAction: () => console.log("add clear form logic")
      //     }}
      //   />
      <Page
        breadcrumbs={[{ content: "Products", onAction: redirectToProduct }]}
        title={title}
        thumbnail={<Thumbnail source={image} />}
        primaryAction={[
          { content: "Cancel", id: "btn-cancel", onAction: redirectToProduct },
          { content: "Save", id: "btn-save", onAction: this.handleSave }
        ]}
      >
        <Card>{card_section}</Card>
        <div className="right-align">
          <Button onClick={this.handleCreate}>Create metafield</Button>
        </div>
      </Page>
      // </Frame>
    );
  }
}

export default CreateProduct;